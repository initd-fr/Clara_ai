import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "User"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    isPaid = Column(Boolean, default=False)
    dataConsent = Column(Boolean, default=False)
    accountType = Column(String)
    sessionToken = Column(String)
    previousToken = Column(String)
    resetPasswordToken = Column(String)
    resetPasswordTokenDate = Column(DateTime)
    currentDailyMessages = Column(Integer, default=0)
    firstName = Column(String)
    lastName = Column(String)
    userImage = Column(String)
    email = Column(String, unique=True, nullable=False)
    newEmail = Column(String)
    newEmailToken = Column(String)
    newEmailTokenDate = Column(DateTime)
    password = Column(String, nullable=False)
    role = Column(String, default="user")
    lastReset = Column(DateTime)
    lastConnection = Column(DateTime)
    isOnline = Column(Boolean, default=False)
    passwordLastChanged = Column(DateTime)
    dailyMessages = Column(Integer, default=20)
    # Relations
    models = relationship(
        "Models", back_populates="userIdRelation", foreign_keys="Models.userId"
    )
    messages = relationship(
        "Message", back_populates="userIdRelation", foreign_keys="Message.userId"
    )
    account = relationship(
        "Account", back_populates="user", foreign_keys="Account.userId"
    )
    subscription = relationship(
        "Subscription",
        back_populates="user",
        uselist=False,
        foreign_keys="Subscription.userId",
    )
    UserLogs = relationship(
        "UserLogs", back_populates="user", foreign_keys="UserLogs.userId"
    )
    # storeAccess, tickets, assignedTickets, staffActions, userSubscriptions, StoreChat, StoreChatMessage à ajouter si besoin


class Models(Base):
    __tablename__ = "Models"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    prompt = Column(String)
    isAnExpert = Column(Boolean, default=False)
    isTemplate = Column(Boolean, default=False)
    modelName = Column(String, ForeignKey("iaLlm.value"))
    provider = Column(String, ForeignKey("iaProvider.value"), default="openai")
    bucketName = Column(String)
    userId = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=True)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    # Relations
    userIdRelation = relationship(
        "User", back_populates="models", foreign_keys=[userId]
    )
    modelNameRelation = relationship(
        "iaLlm", back_populates="models", foreign_keys=[modelName]
    )
    providerRelation = relationship(
        "iaProvider", back_populates="models", foreign_keys=[provider]
    )
    messages = relationship(
        "Message", back_populates="modelIdRelation", foreign_keys="Message.modelId"
    )
    documents = relationship(
        "Document", back_populates="modelIdRelation", foreign_keys="Document.modelId"
    )
    # storeAccess, storeModel à ajouter si besoin


class Document(Base):
    __tablename__ = "Document"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    text = Column(Text)
    minioPath = Column(String)
    mimeType = Column(String)
    size = Column(Integer)
    segmentOrder = Column(Integer)
    pageNumber = Column(Integer)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    modelId = Column(Integer, ForeignKey("Models.id"), nullable=True)
    modelIdRelation = relationship(
        "Models", back_populates="documents", foreign_keys=[modelId]
    )
    # embedding = Column(...) # VECTOR(1536) non supporté nativement


class Message(Base):
    __tablename__ = "Message"
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text)
    isBot = Column(Boolean, default=False)
    createdAt = Column(DateTime)
    userId = Column(UUID(as_uuid=True), ForeignKey("User.id"))
    modelId = Column(Integer, ForeignKey("Models.id"), nullable=True)
    userIdRelation = relationship(
        "User", back_populates="messages", foreign_keys=[userId]
    )
    modelIdRelation = relationship(
        "Models", back_populates="messages", foreign_keys=[modelId]
    )
    # document, ticketTracings à ajouter si besoin


class Account(Base):
    __tablename__ = "Account"
    id = Column(String, primary_key=True)
    userId = Column(UUID(as_uuid=True), ForeignKey("User.id"))
    type = Column(String)
    provider = Column(String)
    providerAccountId = Column(String)
    refresh_token = Column(String)
    access_token = Column(String)
    expires_at = Column(Integer)
    token_type = Column(String)
    scope = Column(String)
    id_token = Column(String)
    session_state = Column(String)
    user = relationship("User", back_populates="account", foreign_keys=[userId])


class UserLogs(Base):
    __tablename__ = "UserLogs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(UUID(as_uuid=True), ForeignKey("User.id"))
    action = Column(String)
    modelType = Column(String)
    modelId = Column(Integer)
    date = Column(DateTime)
    description = Column(String)
    firstName = Column(String)
    lastName = Column(String)
    email = Column(String)
    createdAt = Column(DateTime)
    user = relationship("User", back_populates="UserLogs", foreign_keys=[userId])


class Subscription(Base):
    __tablename__ = "Subscription"
    id = Column(String, primary_key=True)
    status = Column(String)
    currentPeriodStart = Column(DateTime)
    currentPeriodEnd = Column(DateTime)
    cancelAtPeriodEnd = Column(Boolean, default=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("User.id"), unique=True)
    user = relationship("User", back_populates="subscription", foreign_keys=[userId])
    accountType = Column(String)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)


class iaProvider(Base):
    __tablename__ = "iaProvider"
    id = Column(Integer, primary_key=True, autoincrement=True)
    value = Column(String, unique=True, nullable=False)
    label = Column(String)
    text = Column(String)
    className = Column(String, default="")
    enabled = Column(Boolean, default=True)
    llms = relationship(
        "iaLlm", back_populates="providerRelation", foreign_keys="iaLlm.provider"
    )
    models = relationship(
        "Models", back_populates="providerRelation", foreign_keys="Models.provider"
    )


class iaLlm(Base):
    __tablename__ = "iaLlm"
    id = Column(Integer, primary_key=True, autoincrement=True)
    value = Column(String, unique=True, nullable=False)
    label = Column(String)
    text = Column(String)
    className = Column(String, default="")
    provider = Column(String, ForeignKey("iaProvider.value"))
    providerRelation = relationship(
        "iaProvider", back_populates="llms", foreign_keys=[provider]
    )
    useOnlyHumanMessage = Column(Boolean, default=False)
    enabled = Column(Boolean, default=True)
    maxInputTokens = Column(Integer, default=1)
    maxOutputTokens = Column(Integer, default=1)
    temperatureIsForced = Column(Boolean, default=False)
    temperatureForcedValue = Column(Float, default=1)
    description = Column(String, default="")
    availableSubscriptions = Column(String, default="[]")
    models = relationship(
        "Models", back_populates="modelNameRelation", foreign_keys="Models.modelName"
    )
