// Khung thời gian năm học tiểu học: HK1 từ tháng 9 đến hết tháng 1, HK2 từ tháng 2 đến hết tháng 5.
// Hè (tháng 6–8) chuẩn bị cho năm học mới nên mặc định trỏ về HK1.
export const SEMESTER_RANGE = { 1: "T9 – T1", 2: "T2 – T5" };

export function currentSemester(date = new Date()) {
  const m = date.getMonth() + 1;
  return m >= 2 && m <= 5 ? 2 : 1;
}
