import logging


def setup_logging():
    logging.basicConfig(
        level=logging.DEBUG,
        filename='services.log',
        filemode='a',
        encoding='utf-8',
        format='%(asctime)s %(levelname)s %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    logger = logging.getLogger(__name__)
    return logger


logger = setup_logging()


def supplier_log(abr):
    def logged(func):
        def wrapper(*args, **kwargs):
            logger.info(f'[{abr}] {func.__name__} - start')
            f = func(*args, **kwargs)
            logger.info(f'[{abr}] {func.__name__} - finnish')
            return f
        return wrapper
    return logged
