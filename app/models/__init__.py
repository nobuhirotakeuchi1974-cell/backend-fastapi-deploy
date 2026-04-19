# このファイルを import することで全モデルが Base.metadata に登録される
# create_tables() より前に必ず import すること
from app.models.user import Department, User  # noqa: F401
from app.models.post import Post  # noqa: F401
from app.models.evaluation import Evaluation  # noqa: F401
from app.models.points_ledger import PointsLedger  # noqa: F401
