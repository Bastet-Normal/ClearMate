"""User service – business logic for registration & login."""

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import TokenResponse, UserOut, UserRegister


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, data: UserRegister) -> TokenResponse:
        email = str(data.email).strip().lower()
        existing = await self.repo.get_by_email(email)
        if existing:
            raise ValueError("该邮箱已注册")

        user = User(
            email=email,
            nickname=data.nickname.strip(),
            hashed_password=hash_password(data.password),
        )
        try:
            user = await self.repo.create(user)
        except IntegrityError as exc:
            await self.repo.db.rollback()
            raise ValueError("该邮箱已注册") from exc

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user=UserOut.model_validate(user),
        )

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self.repo.get_by_email(email.strip().lower())
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("邮箱或密码错误")
        if not user.is_active:
            raise ValueError("账号已被禁用")

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user=UserOut.model_validate(user),
        )

    async def get_current_user(self, user_id: int) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("用户不存在或已禁用")
        return user
