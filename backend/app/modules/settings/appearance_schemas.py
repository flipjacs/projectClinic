from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Theme = Literal["light", "dark", "system"]
Density = Literal["compact", "comfortable", "spacious"]
Language = Literal["pt-BR", "en", "es"]


class AppearancePreferencesIO(BaseModel):
    reduced_motion: bool
    high_contrast: bool
    confirm_critical_actions: bool
    auto_save_filters: bool
    reopen_last_page: bool


class AppearanceSettingsUpdate(BaseModel):
    theme: Theme
    density: Density
    language: Language
    preferences: AppearancePreferencesIO


class AppearanceSettingsRead(BaseModel):
    theme: Theme
    density: Density
    language: Language
    preferences: AppearancePreferencesIO
