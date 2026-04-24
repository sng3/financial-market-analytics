from pathlib import Path
import sys

import pytest


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture()
def app(tmp_path, monkeypatch):
    db_file = tmp_path / 'test_app.db'

    monkeypatch.setenv('WERKZEUG_RUN_MAIN', 'false')

    import app as app_package
    import app.db as db_module

    app_package._scheduler = None
    db_module.DB_PATH = str(db_file)

    flask_app = app_package.create_app()
    flask_app.config.update(TESTING=True)

    yield flask_app


@pytest.fixture()
def client(app):
    return app.test_client()
