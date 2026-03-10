
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base

from auth import router as auth_router
from equipment import router as equipment_router
from rooms import router as rooms_router
from reservations import router as reservations_router
from notifications import router as notifications_router
from equipment_returns import router as equipment_returns_router
from analytics import router as analytics_router

app = FastAPI()

# enable CORS for frontend
origins = [
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import models so metadata is registered, then create tables
import models  # noqa: F401
Base.metadata.create_all(bind=engine)

# include routers
app.include_router(auth_router)
app.include_router(equipment_router)
app.include_router(rooms_router)
app.include_router(reservations_router)
app.include_router(notifications_router)
app.include_router(equipment_returns_router)
app.include_router(analytics_router)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "AVRC Reservation System Backend is running!"}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        db.execute(text("SELECT 1"))
        return {"db_status": "Connected"}
    except Exception as e:
        return {"db_status": "Error", "details": str(e)}
