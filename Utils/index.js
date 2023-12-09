/**
 * 쿠키가 담긴 Objecet를 반환합니다
 * @param {string} cookieRaw
 * @returns object
 */
export const getCookieParams = (cookieRaw) =>
  cookieRaw
    .split(';')
    .map((param) => Object.fromEntries(new URLSearchParams(param.trim())))
    .reduce((acc, cur) => {
      acc = { ...acc, ...cur };
      return acc;
    }, {});
