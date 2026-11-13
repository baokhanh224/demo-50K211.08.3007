import math


class BusinessError(Exception):
    def __init__(self, message, fields=None, status=400):
        super().__init__(message)
        self.fields, self.status = fields or {}, status


def fail(message, fields=None):
    raise BusinessError(message, fields)


def present(value):
    return value is not None and str(value).strip() != ""


def number(value):
    if value is None or value == "":
        return 0
    try:
        return float(value)
    except (ValueError, TypeError):
        return float("nan")


def positive(value):
    n = number(value)
    return present(value) and math.isfinite(n) and n > 0


def integer(value):
    n = number(value)
    return (
        present(value)
        and math.isfinite(n)
        and n.is_integer()
        and abs(n) <= 9007199254740991
    )


def required(data, keys, message="Không được để trống!"):
    fields = {k: message for k in keys if not present(data.get(k))}
    if fields:
        fail(message, fields)
