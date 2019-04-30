/**
 * Created by silva on 2019-04-28.
 */

let RANDOM_PHONE_NO_LIST = ['010-6288-1354', '010-2828-1354'];

$(document).ready(function () {

    // random phone no
    const randomPhoneNo = RANDOM_PHONE_NO_LIST[Math.floor(Math.random() * RANDOM_PHONE_NO_LIST.length)];
    $('.random_phone_no').text(randomPhoneNo);

    let telBtnHtml = `
    <a href="tel:${randomPhoneNo}">
        <img src="/resource/img/hantax/mobile/btn_2.png" class="img-responsive">
    </a>`
    $("#telBtn").html(telBtnHtml);

});