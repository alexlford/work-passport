"""Regression coverage for deliberate image-free program cards."""
import unittest

import validate


class ProgramMediaTests(unittest.TestCase):
    def test_explicit_title_treatment(self):
        validate.program_media({"media": None, "label": "RMWT / GMI"}, "program")

    def test_image_url(self):
        validate.program_media({"media": "https://example.com/program.jpg"}, "program")

    def test_missing_field_is_not_an_explicit_title_treatment(self):
        with self.assertRaisesRegex(ValueError, "explicit null"):
            validate.program_media({"label": "RMWT / GMI"}, "program")

    def test_title_treatment_requires_label(self):
        for label in (None, "", "   "):
            with self.subTest(label=label), self.assertRaisesRegex(ValueError, "nonempty label"):
                validate.program_media({"media": None, "label": label}, "program")

    def test_invalid_image_values_are_rejected(self):
        for media in ("", 123, "javascript:alert(1)", "./assets/missing-image.webp"):
            with self.subTest(media=media), self.assertRaises(ValueError):
                validate.program_media({"media": media}, "program")


if __name__ == "__main__":
    unittest.main()
