import { IconFormatter } from './icon-formatter';

const MONO_SVG_1 =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_595_647)"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.0156 3.98442H15.8917V1.17188C15.8917 0.524999 15.3667 -2.8278e-08 14.7198 0C14.0729 2.82753e-08 13.5479 0.524999 13.5479 1.17188V3.98442H10.4062V2.19842C10.4062 1.55154 9.88119 1.02654 9.23431 1.02654C8.58744 1.02654 8.06244 1.55154 8.06244 2.19842V3.98442H7.03119C5.35119 3.98442 3.98431 5.3513 3.98431 7.0313V8.08541H1.14893C0.50205 8.08541 -0.0229493 8.61041 -0.0229492 9.25729C-0.0229491 9.90416 0.50205 10.4292 1.14893 10.4292H3.98431V13.5709H2.17547C1.52859 13.5709 1.00359 14.0959 1.00359 14.7428C1.00359 15.3896 1.52859 15.9146 2.17547 15.9146H3.98431V16.9688C3.98431 18.6488 5.35119 20.0157 7.03119 20.0157H8.06244L8.06244 22.8282C8.06244 23.475 8.58744 24 9.23431 24C9.88119 24 10.4062 23.475 10.4062 22.8282V20.0157H13.5479V21.8016C13.5479 22.4485 14.0729 22.9735 14.7198 22.9735C15.3667 22.9735 15.8917 22.4485 15.8917 21.8016V20.0157H17.0156C18.6956 20.0157 20.0624 18.6488 20.0624 16.9688V15.9146H22.8051C23.452 15.9146 23.977 15.3896 23.977 14.7428C23.977 14.0959 23.452 13.5709 22.8051 13.5709H20.0624V10.4292H21.7786C22.4255 10.4292 22.9505 9.90416 22.9505 9.25729C22.9505 8.61041 22.4255 8.08541 21.7786 8.08541H20.0624V7.0313C20.0624 5.3513 18.6956 3.98442 17.0156 3.98442ZM7.03119 6.32817C6.64353 6.32817 6.32806 6.64364 6.32806 7.0313V16.9688C6.32806 17.3565 6.64353 17.6719 7.03119 17.6719H17.0156C17.4032 17.6719 17.7187 17.3565 17.7187 16.9688V7.0313C17.7187 6.64364 17.4032 6.32817 17.0156 6.32817H7.03119Z" fill="#424242"/></g><defs><clipPath id="clip0_595_647"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>';

const COLOR_SVG_1 =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.18408 3.79297H21.8158V20.2148H2.18408V3.79297Z" fill="#0F9D58"/><path d="M16.4543 12.4537C17.1342 12.4537 17.6812 11.9024 17.6812 11.2268C17.6812 10.5513 17.1299 10 16.4543 10C15.7788 10 15.2275 10.5513 15.2275 11.2268C15.2275 11.9024 15.7788 12.4537 16.4543 12.4537ZM16.4525 13.2691C15.1391 13.2691 13.7262 13.9653 13.7262 14.8275V15.7228H19.1788V14.8275C19.1788 13.9653 17.766 13.2691 16.4525 13.2691ZM7.72934 12.4537C8.40916 12.4537 8.95619 11.9024 8.95619 11.2268C8.95619 10.5513 8.40491 10 7.72934 10C7.05376 10 6.50249 10.5513 6.50249 11.2268C6.50249 11.9024 7.05376 12.4537 7.72934 12.4537ZM7.7263 13.2691C6.41284 13.2691 5 13.9653 5 14.8275V15.7228H10.4526V14.8275C10.4526 13.9653 9.03976 13.2691 7.7263 13.2691Z" fill="#57BB8A"/><path d="M11.8128 11.3644C12.7163 11.3644 13.4503 10.6307 13.446 9.72693C13.446 8.82344 12.7124 8.08951 11.8086 8.09377C10.9051 8.09377 10.1754 8.82739 10.1754 9.73119C10.1754 10.635 10.909 11.3644 11.8128 11.3644ZM11.8083 12.4575C9.96876 12.4575 7.99219 13.4357 7.99219 14.6377V15.7278H15.6241V14.6377C15.6241 13.4315 13.6481 12.4575 11.8083 12.4575Z" fill="#F7F7F7"/><path d="M14.0212 19.0117H18.9268V20.2148H14.0212V19.0117Z" fill="#F1F1F1"/><path d="M22.3623 1.64111H1.63742C0.73301 1.64111 0 2.37412 0 3.27853V20.734C0 21.6336 0.733618 22.3672 1.63742 22.3672H22.3626C23.2667 22.3672 24 21.6342 24 20.7298V3.27853C23.9957 2.37473 23.2661 1.64111 22.3623 1.64111ZM21.811 20.1879H2.17928V3.82039H21.811V20.1879Z" fill="#F4B400"/></svg>';

describe('IconFormatter', () => {
  it('should return a function', () => {
    const iconFormatter = IconFormatter({
      mode: 'file',
      color: false,
    });
    expect(typeof iconFormatter).toBe('function');
  });
  it('should return a string', () => {
    const iconFormatter = IconFormatter({
      mode: 'file',
      color: false,
    });
    const optimized = iconFormatter('ai.base-model', MONO_SVG_1);
    expect(typeof optimized).toBe('string');
  });
  it('should optimize a mono icon for file', () => {
    const iconFormatter = IconFormatter({
      mode: 'file',
      color: false,
    });
    const optimized = iconFormatter('ai.base-model', MONO_SVG_1);
    expect(optimized.startsWith('<symbol')).toBe(true);
    expect(optimized).toContain('id="ai.base-model"');
    expect(optimized).toContain('fill="currentColor"');
    expect(optimized).toContain('clip-path="url(#ai-base-model_g_a)"');
    expect(optimized).toContain('id="ai-base-model_g_a"');
    expect(optimized).not.toContain('width="24"');
    expect(optimized).not.toContain('height="24"');
  });
  it('should optimize a mono icon for component', () => {
    const iconFormatter = IconFormatter({
      mode: 'component',
      color: false,
    });
    const optimized = iconFormatter('ai.base-model', MONO_SVG_1);
    expect(optimized.startsWith('<symbol')).toBe(true);
    expect(optimized).toContain('id="ai.base-model"');
    expect(optimized).toContain('fill="currentColor"');
    expect(optimized).toContain('clipPath="url(#ai-base-model_g_a)"');
    expect(optimized).toContain('id="ai-base-model_g_a"');
    expect(optimized).not.toContain('width="24"');
    expect(optimized).not.toContain('height="24"');
  });
  it('should optimize a color icon', () => {
    const iconFormatter = IconFormatter({
      mode: 'file',
      color: true,
    });
    const optimized = iconFormatter('brands.classroom', COLOR_SVG_1);
    expect(optimized.startsWith('<symbol')).toBe(true);
    expect(optimized).toContain('id="brands.classroom"');
    expect(optimized).not.toContain('width="24"');
    expect(optimized).not.toContain('height="24"');
    expect(optimized).not.toContain('fill="currentColor"');
    expect(optimized).toContain('fill="#0F9D58"');
    expect(optimized).toContain('fill="#F4B400"');
  });
});
