import { useTranslation } from "react-i18next";
import { uiText } from "../../utils/runtimeCopy";

export function useNuxeraLanguage() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const language = String(i18n.language || "es").toLowerCase().startsWith("en") ? "en" : "es";
  return { L, language };
}
