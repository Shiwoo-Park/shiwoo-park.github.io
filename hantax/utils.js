/**
 * Created by silva on 2019-04-28.
 */

var relationshipDic = {
    spouse: '배우자',
    child: '자녀',
    sibling: '형제자매',
    'self-parents': '본인(조)부모',
    'spouse-parents': '배우자(조)부모',
    etc: '기타'
};

var submitTypeDic = { post: '우편', fax: '팩스', email: '이메일', kakao: '카톡' };

function getRelationshipVal(displayVal){
    var ret = "";
    Object.keys(relationshipDic).map(function (val) {
        if(ret != "") return;
        if(displayVal == relationshipDic[val]) ret = val;
    });
    return ret;
}

function errAlert(err) {
    console.log("errAlert", err);
    var msg = err;
    if (typeof err === "object") {
        if (err.responseJSON) {
            if (Array.isArray(err.responseJSON)) {
                msg = err.responseJSON[0].msg;
            } else if (err.responseJSON.msg) {
                msg = err.responseJSON.msg;
            } else {
                msg = err.responseText;
            }
        } else if (err.responseText && !err.responseText.startsWith('<html>')) {
            msg = err.responseText;
        } else {
            msg = "[" + err.status + "] " + err.statusText;
        }
    }
    alert(msg);
}

function startsWith(string, prefix) {
    return string.slice(0, prefix.length) == prefix;
}

function commaSeparateNumber(val) {
    while (/(\d+)(\d{3})/.test(val.toString())) {
        val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
    }
    return val;
}

function removeCommaNumber(val) {
    if (typeof val === "string")
        val = val.split(',').join('');
    return val;
}

function getTaxRate(standardTax) {
    // input : 과세표준
    // output : percentage
    if (standardTax < 12000000)
        return 6;
    if (standardTax < 46000000)
        return 15;
    if (standardTax < 88000000)
        return 24;
    if (standardTax < 150000000)
        return 35;
    return 38;
}

function getCalculatedTax(standardTax) {
    if (standardTax < 12000000)
        return standardTax * 6 / 100;
    if (standardTax < 46000000)
        return (standardTax * 15 / 100) - 1080000;
    if (standardTax < 88000000)
        return (standardTax * 24 / 100) - 5220000;
    if (standardTax < 150000000)
        return (standardTax * 35 / 100) - 14900000;
    return (standardTax * 38 / 100) - 19400000;
}

function getEarnedTaxCredit(calculatedTax, earnedIncome, totalIncome) {
    var ret = calculatedTax * earnedIncome / totalIncome;
    if (ret < 1300001) {
        ret = ret * 55 / 100;
    } else {
        ret = 715000 + (ret - 1300000) * 0.3;
    }
    return Math.min(ret.toFixed(2), 740000);
}

var randomScalingFactor = function () {
    return Math.round(Math.random() * 100)
};