import bcrypt

from auth.jwt_service import create_access_token
from database import get_connection


# =====================================================
# HASH PASSWORD
# =====================================================

def hash_password(password: str) -> str:

    password_bytes = password.encode(
        "utf-8"
    )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode(
        "utf-8"
    )


# =====================================================
# VERIFY PASSWORD
# =====================================================

def verify_password(
    password: str,
    password_hash: str
) -> bool:

    password_bytes = password.encode(
        "utf-8"
    )

    hash_bytes = password_hash.encode(
        "utf-8"
    )

    return bcrypt.checkpw(
        password_bytes,
        hash_bytes
    )


# =====================================================
# CREATE USER
# =====================================================

def create_user(
    name: str,
    email: str,
    password: str,
    role: str
):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # =========================================
            # CHECK WHETHER EMAIL ALREADY EXISTS
            # =========================================

            cursor.execute(
                """
                SELECT id
                FROM users
                WHERE email = %s
                """,
                (email,)
            )

            existing_user = cursor.fetchone()

            if existing_user:

                return {
                    "success": False,
                    "message":
                        "An account with this email already exists."
                }

            # =========================================
            # HASH PASSWORD
            # =========================================

            password_hash = hash_password(
                password
            )

            # =========================================
            # INSERT NEW USER
            # =========================================

            cursor.execute(
                """
                INSERT INTO users
                (
                    name,
                    email,
                    password_hash,
                    role
                )
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (
                    name,
                    email,
                    password_hash,
                    role
                )
            )

            result = cursor.fetchone()

            user_id = result["id"]

            connection.commit()

            # =========================================
            # CREATE JWT
            # =========================================

            token = create_access_token(
                user_id=user_id,
                role=role
            )

            # =========================================
            # RETURN USER + JWT
            # =========================================

            return {
                "success": True,

                "message":
                    "Account created successfully.",

                "access_token":
                    token,

                "user": {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "role": role
                }
            }

    finally:

        connection.close()


# =====================================================
# LOGIN USER
# =====================================================

def login_user(
    email: str,
    password: str
):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            # =========================================
            # FIND USER
            # =========================================

            cursor.execute(
                """
                SELECT *
                FROM users
                WHERE email = %s
                """,
                (email,)
            )

            user = cursor.fetchone()

            # =========================================
            # USER NOT FOUND
            # =========================================

            if not user:

                return {
                    "success": False,
                    "message":
                        "Invalid email or password."
                }

            # =========================================
            # VERIFY PASSWORD
            # =========================================

            password_correct = verify_password(
                password,
                user["password_hash"]
            )

            if not password_correct:

                return {
                    "success": False,
                    "message":
                        "Invalid email or password."
                }

            # =========================================
            # CREATE JWT
            # =========================================

            token = create_access_token(
                user_id=user["id"],
                role=user["role"]
            )

            # =========================================
            # RETURN USER + JWT
            # =========================================

            return {
                "success": True,

                "message":
                    "Login successful.",

                "access_token":
                    token,

                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"]
                }
            }

    finally:

        connection.close()