import { type Request } from 'express';
import { lookup } from 'geoip-lite';
import * as countries from 'i18n-iso-countries';

import { type SessionMetadata } from '../types/session-metadata.types';
import { isDev } from './is-dev.util';

import DeviceDetector = require('device-detector-js');

export function getSessionMetadata(
  req: Request,
  userAgent: string,
): SessionMetadata {
  const header =
    req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'];

  const ip = isDev
    ? '95.165.173.59'
    : typeof header === 'string'
      ? header.split(',')[0]
      : Array.isArray(header)
        ? header[0]
        : req.ip;

  const location = lookup(ip);
  const device = new DeviceDetector().parse(userAgent);
  countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

  return {
    location: {
      country: countries.getName(location.country, 'en') || 'Неизвестно',
      city: location.city,
      latitude: location.ll[0] || 0,
      longtitude: location.ll[1] || 0,
    },
    device: {
      browser: device?.client?.name || 'Неизвестно',
      os: device?.os?.name || 'Неизвестно',
      type: device?.device?.type || 'Неизвестно',
    },
    ip,
  };
}
