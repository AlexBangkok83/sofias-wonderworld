/**
 * Things Khru Mali (the elephant mascot) says on the home screen and at the
 * end of a round. Rendered by the same voice as the words.
 */

const w = (th, rom, en) => ({ th, rom, en });

export const GREETINGS = [
  w('สวัสดีค่ะ โซเฟีย', 'sà-wàt-dee kâ, Soh-fia', 'Hello, Sofia!'),
  w('มาเรียนภาษาไทยกันเถอะ', 'maa rian paa-sǎa tai gan tòe', "Let's learn Thai!"),
  w('วันนี้เก่งมากเลย', 'wan-née gèng mâak loei', 'You did great today!'),
  w('เจอกันพรุ่งนี้นะ', 'joe gan prûng-née ná', 'See you tomorrow!'),
];
