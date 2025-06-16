import os
import ast
import sys
from importlib.metadata import distributions

def get_imported_modules(directory):
    imported_modules = set()
    stdlib_modules = set(sys.builtin_module_names).union(sys.stdlib_module_names)

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    try:
                        tree = ast.parse(f.read(), filename=filepath)
                    except:
                        continue

                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            for alias in node.names:
                                module = alias.name.split(".")[0]
                                if module not in stdlib_modules:
                                    imported_modules.add(module)
                        elif isinstance(node, ast.ImportFrom):
                            module = node.module.split(".")[0] if node.module else ""
                            if module and module not in stdlib_modules:
                                imported_modules.add(module)

    return imported_modules

def map_modules_to_packages(modules):
    packages = {}
    for dist in distributions():
        package_name = dist.metadata["Name"]
        for file in dist.files:
            if file.suffix == ".py":
                module = file.stem
                if module in modules:
                    packages[package_name] = dist.version
    return packages

if __name__ == "__main__":
    project_dir = "."  # Cambia esto si es necesario
    modules = get_imported_modules(project_dir)
    packages = map_modules_to_packages(modules)
    
    with open("requirements.txt", "w") as f:
        for name, version in packages.items():
            f.write(f"{name}=={version}\n")