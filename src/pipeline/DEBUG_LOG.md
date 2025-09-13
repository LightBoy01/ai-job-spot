## Session: September 4, 2025 - Persistent `ModuleNotFoundError: No module named 'src'`

**Issue:** The pipeline consistently fails with `ModuleNotFoundError: No module named 'src'` (or `src.pipeline.models`), preventing any Python code execution. This occurred despite numerous attempts to fix Python's module resolution.

**Root Cause Analysis (Hypothesized):**
- The problem is a highly unusual and stubborn interaction between the GitHub Actions runner's environment, how `actions/checkout` places the code, and how Python resolves modules.
- The environment does not correctly add the project root (containing the `src` package) to Python's `sys.path` in a way that makes `src` discoverable as a top-level package.
- This issue persisted through various standard and advanced debugging techniques.

**Solutions Attempted (and their outcomes):**
1.  **Initial `KeyError: 'url'` fix:** Resolved the original scraper bug, but exposed the underlying import issues.
2.  **Adding `__init__.py` files:** Created `src/__init__.py` and `src/pipeline/__init__.py` to explicitly mark directories as packages. (Error persisted)
3.  **Changing relative imports to absolute imports:** Modified `from .models import Job` to `from src.pipeline.models import Job` across pipeline scripts. (Error persisted)
4.  **Adding `sys.path` modification in `run_pipeline.py`:** Manually inserted code to add the project root to `sys.path` at runtime. (Error persisted)
5.  **Correcting `working-directory` and `checkout path` in `pipeline.yml`:** Attempted to align the execution context by setting `defaults.run.working-directory` and `actions/checkout`'s `path` parameter. (Error persisted, and the path sometimes became even more nested).
6.  **Implementing `pyproject.toml` and `pip install -e .`:** Formally defined the project as an installable Python package and installed it in editable mode, the industry-standard solution for such issues. (Error persisted)

**Verification:** All attempts resulted in the `ModuleNotFoundError: No module named 'src'` (or `src.pipeline.models`), indicating the Python interpreter cannot find the top-level `src` package.

**Lessons Learned:**
- This specific environmental issue is highly unusual and defies standard Python packaging and GitHub Actions best practices.
- Further debugging requires more direct control over the runner's environment or external consultation (e.g., GitHub Actions support, Python community forums).

**Update (September 13, 2025):**
- The pipeline is now functioning correctly. The resolution appears to be the combination of correctly setting a `working-directory` in the GitHub Actions workflow and consistently using `pip install -e src/pipeline`. This ensures that the `src` directory is treated as an installed package, making its modules available for import throughout the pipeline execution. The historical issue is considered resolved.