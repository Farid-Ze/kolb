
import pytest
from app.data.norms import APPENDIX_VERSION
from app.engine.norms.composite import AppendixNormProvider
from app.assessments.klsi_v4.logic import _describe_provenance

def test_appendix_provider_returns_versioned_tag():
    provider = AppendixNormProvider()
    # CE scale exists in appendix
    result = provider.percentile([], "CE", 20)
    assert result.percentile is not None
    assert f"|{APPENDIX_VERSION}" in result.provenance
    assert result.provenance.startswith("Appendix:CE")

def test_describe_provenance_parses_appendix_version():
    tag = f"Appendix:CE|{APPENDIX_VERSION}"
    kind, group, version = _describe_provenance(tag)
    assert kind == "appendix"
    assert group == "CE"
    assert version == APPENDIX_VERSION

def test_describe_provenance_handles_legacy_appendix():
    tag = "Appendix:CE"
    kind, group, version = _describe_provenance(tag)
    assert kind == "appendix"
    assert group == "CE"
    assert version == "default" # _split_norm_group_token defaults to "default"

