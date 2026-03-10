"""Deploy the Streamlit app to Snowflake Snowsight"""
import os, tempfile, shutil

os.environ.setdefault('SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_ACCOUNT_ENV')
os.environ.setdefault('SNOWFLAKE_USER', 'SNOWFLAKE_USER_ENV')
os.environ.setdefault('SNOWFLAKE_PASSWORD', 'REDACTED_ROTATE_NOW')
os.environ.setdefault('SNOWFLAKE_DATABASE', 'KUONI_DEMO')
os.environ.setdefault('SNOWFLAKE_WAREHOUSE', 'KUONI_WH')

import snowflake_client as sf

conn = sf.get_connection()
cur  = conn.cursor()

APP_FILE = '/home/stephen/projects/kuoni-data-demo/backend/snowsight_app.py'

print('1. Creating internal stage...')
cur.execute("CREATE STAGE IF NOT EXISTS KUONI_DEMO.PUBLIC.KUONI_STREAMLIT_STAGE ENCRYPTION = (TYPE = 'SNOWFLAKE_SSE')")
print('   ✅ Stage ready')

print('2. Uploading app.py...')
# PUT needs file:// URI; rename to app.py temporarily
tmp_dir = tempfile.mkdtemp()
dst = os.path.join(tmp_dir, 'app.py')
shutil.copy(APP_FILE, dst)
cur.execute(f"PUT file://{dst} @KUONI_DEMO.PUBLIC.KUONI_STREAMLIT_STAGE AUTO_COMPRESS=FALSE OVERWRITE=TRUE")
row = cur.fetchone()
print(f'   ✅ {row}')
shutil.rmtree(tmp_dir)

print('3. Creating Streamlit app...')
cur.execute("""
CREATE OR REPLACE STREAMLIT KUONI_DEMO.PUBLIC.KUONI_DASHBOARD
    ROOT_LOCATION = '@KUONI_DEMO.PUBLIC.KUONI_STREAMLIT_STAGE'
    MAIN_FILE = 'app.py'
    QUERY_WAREHOUSE = 'KUONI_WH'
    TITLE = 'Kuoni Data Intelligence Platform'
""")
print('   ✅ Streamlit created')

print('4. Getting app URL...')
cur.execute("SHOW STREAMLITS IN SCHEMA KUONI_DEMO.PUBLIC")
rows = cur.fetchall()
cols = [d[0] for d in cur.description]
for row in rows:
    d = dict(zip(cols, row))
    if 'KUONI' in str(d.get('name','')).upper():
        print(f'   Name: {d.get("name")}')
        print(f'   URL type: {d.get("url_id", "see Snowsight")}')

cur.close()
conn.close()

print('\n✅ Done! Open Snowsight to view:')
print('   https://app.snowflake.com')
print('   → Left sidebar → Streamlit')
print('   → KUONI_DASHBOARD')
