/**
 * Every amount on the site is shown in Chinese yuan, labelled "RMB" (fmtCNY in format.ts): no conversion into other
 * currencies and no exchange rates. The market list from tools.json stays as the country list for nationality pickers.
 */
import { tools } from '@/data/config';

export const CURRENCIES = tools.currency.currencies.map((c) => ({
  code: c.currency,
  country: c.country,
  countryCode: c.countryCode,
}));
