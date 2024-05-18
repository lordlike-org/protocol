from sqlalchemy import Column, Integer, String

from lordlike_wallet.db.database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    wallet_address = Column(String, unique=True, index=True)
