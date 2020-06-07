import ava from 'ava';
import { bufferSplit } from '../src/util/index';

ava('Buffer split', (test) => {
  const data = Buffer.from('XAAAAXBBBBXCCCCXDDDD');
  const split = Buffer.from('X');

  const res = bufferSplit(data, split);

  test.deepEqual(res[0], Buffer.from('XAAAA'));
  test.deepEqual(res[1], Buffer.from('XBBBB'));
  test.deepEqual(res[2], Buffer.from('XCCCC'));
  test.deepEqual(res[3], Buffer.from('XDDDD'));
});
