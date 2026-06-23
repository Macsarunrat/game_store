import { novaVar } from './nova-color';

/** พื้นหลังมืดมาตรฐานของ SweetAlert2 */
export function novaSwalDarkBase() {
  return {
    background: novaVar('--nova-primary'),
    color: novaVar('--nova-text-on-dark'),
  };
}

/** ปุ่มยืนยันหลัก (primary dark) */
export function novaSwalConfirmPrimary() {
  return {
    confirmButtonColor: novaVar('--nova-primary-dark'),
  };
}

/** ปุ่มยืนยันสี brand (primary) */
export function novaSwalConfirmBrand() {
  return {
    confirmButtonColor: novaVar('--nova-bg-deep'),
  };
}

/** ปุ่มยืนยันสีทอง */
export function novaSwalConfirmAccent() {
  return {
    confirmButtonColor: novaVar('--nova-accent'),
  };
}

/** ชุดลบ / ยกเลิก */
export function novaSwalDangerActions() {
  return {
    confirmButtonColor: novaVar('--nova-danger-swal'),
    cancelButtonColor: novaVar('--nova-info-swal'),
  };
}

/** ชุดยืนยัน + deny + cancel (game-manage) */
export function novaSwalMultiAction() {
  return {
    confirmButtonColor: novaVar('--nova-accent'),
    denyButtonColor: novaVar('--nova-danger-swal'),
    cancelButtonColor: novaVar('--nova-info-swal'),
  };
}
