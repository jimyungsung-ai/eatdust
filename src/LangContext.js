import { createContext, useContext } from 'react'
import { T } from './i18n'

export const LangContext = createContext('vn')

export function useLang() {
  const lang = useContext(LangContext)
  return { lang, t: T[lang] }
}
