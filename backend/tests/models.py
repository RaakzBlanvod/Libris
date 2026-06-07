# tests/models.py
from src.modules.books.models import Book, Author, Genre  # noqa: F401
from src.modules.users.models import User  # noqa: F401
from src.modules.auth.models import RefreshToken  # noqa: F401
from src.modules.reviews.models import Review, ReviewLike  # noqa: F401
from src.modules.bookmarks.models import Bookmark  # noqa: F401
