import psycopg2

try:
    conn = psycopg2.connect('postgresql://postgres:postgres@localhost/avanta')
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE contacts ADD COLUMN feedback TEXT;')
    print('Feedback column added successfully')
    conn.close()
except Exception as e:
    print('Error:', e)
