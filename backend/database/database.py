import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import quote_plus

load_dotenv()
logger = logging.getLogger(__name__)

base_dir = os.path.dirname(os.path.abspath(__file__))
sqlite_path = os.path.join(base_dir, "..", "stocksikh.db")
sqlite_url = f"sqlite:///{os.path.abspath(sqlite_path)}"

# Check for explicit DATABASE_URL or MySQL credentials
db_url = os.getenv("DATABASE_URL")

if not db_url:
    db_user = os.getenv("DB_USER")
    db_pass = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT", "3306")
    db_name = os.getenv("DB_NAME")

    if db_user and db_pass and db_host and db_name:
        encoded_pass = quote_plus(db_pass)
        db_url = f"mysql+pymysql://{db_user}:{encoded_pass}@{db_host}:{db_port}/{db_name}"
    else:
        db_url = sqlite_url

def build_engine(target_url: str):
    connect_args = {"check_same_thread": False} if "sqlite" in target_url else {}
    return create_engine(
        target_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )

engine = build_engine(db_url)

# Test the connection; if external DB (e.g. MySQL on localhost in cloud) fails, fallback to SQLite safely
if "sqlite" not in db_url:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected successfully to configured database.")
    except Exception as ex:
        logger.warning(f"Failed to connect to configured DB ({ex}). Falling back to local SQLite dataset: {sqlite_path}")
        db_url = sqlite_url
        engine = build_engine(sqlite_url)

DATABASE_URL = db_url

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
