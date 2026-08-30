import { APP_NAME, APP_VERSION, DEFAULT_PERIODS_PER_DAY, SMALL_PERIODS_PER_BIG } from '../src/constants';

test('P0: 常量配置正确', () => {
  expect(APP_NAME).toBe('H课程表');
  expect(APP_VERSION).toBe('1.0.0');
  expect(DEFAULT_PERIODS_PER_DAY).toBe(10);
  expect(SMALL_PERIODS_PER_BIG).toBe(2);
});
