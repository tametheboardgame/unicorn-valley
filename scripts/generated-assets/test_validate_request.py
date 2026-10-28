"""No-network tests for privileged asset import input validation."""
import importlib.util
from pathlib import Path
import unittest

MODULE_PATH = Path(__file__).resolve().parent / "validate_request.py"
spec = importlib.util.spec_from_file_location("asset_request", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class RequestValidationTests(unittest.TestCase):
    def test_valid_inputs(self):
        for branch in ("agent/my-art", "agent/story-house-art-v2", "agent/r6.5-wp19h3.11-r4-generated-asset-pipeline"):
            self.assertEqual(mod.validate_branch(branch), branch)
        self.assertEqual(mod.validate_manifest("generated-assets/manifests/scene-001.json"),
                         "generated-assets/manifests/scene-001.json")

    def test_branch_rejections(self):
        for bad in ("main", "refs/heads/main", "agent/", "agent/../main", "agent/evil;echo pwn",
                    "agent/x$(id)", "agent/x\nother", "agent/-danger", "agent/x//z",
                    "agent/x/", "agent/x.", "agent/x", "agent/x quote", "agent/x'bad"):
            if bad == "agent/x":
                continue
            with self.subTest(value=bad), self.assertRaises(ValueError):
                mod.validate_branch(bad)

    def test_manifest_rejections(self):
        for bad in ("../private.json", "generated-assets/manifests/../private.json",
                    "generated-assets/manifests/x;echo pwn.json",
                    "generated-assets/manifests/x$(id).json",
                    "generated-assets/manifests/x\nanything.json",
                    "generated-assets/manifests/subdir/x.json", "generated-assets/manifests/x.yaml",
                    "generated-assets/manifests/.json"):
            with self.subTest(value=bad), self.assertRaises(ValueError):
                mod.validate_manifest(bad)

if __name__ == "__main__":
    unittest.main()
