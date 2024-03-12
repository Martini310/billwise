import os
from importlib import import_module

__all__ = []

module_files = [file[:-3] for file in os.listdir('base/services/suppliers') if file.endswith('.py') and file != '__init__.py']
for module in module_files:
    module = import_module(f'base.services.suppliers.{module}')
    __all__.append(*module.__all__)
