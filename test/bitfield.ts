import ava from 'ava';
import BitField from '../src/lib/base/BitField';

ava('BitField', (test) => {
  const field = new BitField(0b11111111);

  for (let i = 0; i < 8; i++) {
    test.is(field.getBit(i), 1);

    field.clearBit(i);
    test.is(field.getBit(i), 0);
    field.setBit(i);

    test.is(field.getBit(i), 1);
  }
});
