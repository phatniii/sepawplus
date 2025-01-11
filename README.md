
- npx prisma migrate
- npx prisma migrate dev or prisma db push
- npx prisma generate
## Step 1: Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql
```

## Step 2: Set Up PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE sepawv2;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'root';
GRANT ALL PRIVILEGES ON DATABASE sepawv2 TO postgres;
sudo service postgresql restart
```

## Step 3: Set Up a User:

```bash
sudo -i -u postgres
psql
CREATE USER your_username WITH PASSWORD 'your_password';
CREATE DATABASE sepawv2;
GRANT CONNECT ON DATABASE sepawv2 TO your_username;
\q

```
# Test user
```bash
psql -U admin_sepaw -d sepawv2
```
## Add User PostgreSQL

/etc/postgresql/14/main/pg_hba.conf

# Database administrative login by Unix domain socket
local   all             postgres                                peer
local   all             admin_sepaw                             md5


# IPv4 local connections:
host        sepawv2         postgres        <IP>/32         md5
hostssl     sepawv2         admin_sepaw   184.82.27.240/32   md5


Check PostgreSQL Configuration:
On the remote PostgreSQL server, check the postgresql.conf file for the following settings:
listen_addresses = '*'      # Listen on all available network interfaces
port = 5432                 # Default PostgreSQL port

```bash
sudo service postgresql restart
```

COPY public.gender (gender_id, gender_describe) FROM stdin;
1	ชาย
2	หญิง
3	ไม่ระบุ

COPY public.status (status_id, status_name) FROM stdin;
1	ผู้ดูแลผู้สูงอายุ
2	เจ้าหน้าที่ อบต.
3   admin

COPY public.marrystatus (marry_id, marry_describe) FROM stdin;
1	โสด
2	สมรส
3	หย่า/หม้าย
4	แยกกันอยู่"# sepawplus" 
