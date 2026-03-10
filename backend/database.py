from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Update these as needed
DB_USER = "root"
DB_PASSWORD = ""
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "avrc_db"

SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
