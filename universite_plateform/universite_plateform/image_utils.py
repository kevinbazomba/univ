from io import BytesIO
from pathlib import Path
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError

ALLOWED_IMAGE_FORMATS = {'JPEG', 'PNG', 'WEBP', 'GIF'}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024


def validate_image_upload(upload):
    if not upload:
        return
    if upload.size > MAX_UPLOAD_SIZE:
        raise ValidationError("L'image ne doit pas dépasser 10 Mo.")
    try:
        image = Image.open(upload)
        image.verify()
        image_format = image.format
        upload.seek(0)
    except (UnidentifiedImageError, OSError, ValueError):
        raise ValidationError("Le fichier envoyé n'est pas une image valide.")
    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError('Formats autorisés : JPG, JPEG, PNG, WebP et GIF.')


def _open_image(upload):
    upload.seek(0)
    image = Image.open(upload)
    if getattr(image, 'is_animated', False):
        image.seek(0)
    return ImageOps.exif_transpose(image)


def optimize_student_photo(upload):
    validate_image_upload(upload)
    image = _open_image(upload)
    image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    image = image.convert('RGBA' if image.mode in ('RGBA', 'LA') else 'RGB')
    output = BytesIO()
    image.save(output, format='WEBP', quality=78, method=6, optimize=True)
    return ContentFile(output.getvalue(), name=f'etudiant-{uuid4().hex}.webp')


def optimize_university_logo(upload):
    validate_image_upload(upload)
    image = _open_image(upload)
    image.thumbnail((600, 600), Image.Resampling.LANCZOS)
    if image.mode not in ('RGB', 'RGBA'):
        image = image.convert('RGBA')
    image = image.convert('P', palette=Image.Palette.ADAPTIVE, colors=128)
    output = BytesIO()
    image.save(output, format='GIF', optimize=True)
    stem = Path(upload.name).stem[:40] or 'logo'
    return ContentFile(output.getvalue(), name=f'{stem}-{uuid4().hex[:10]}.gif')
