/**
 * Created by silva on 2019-04-28.
 */

let RANDOM_PHONE_NO_LIST = ['010-6288-1354', '010-2828-1354'];

$(document).ready(function () {

    var requestTimeout = 3000; // ms
    var api = {
        get: function (url, data, success, failed) {
            if (!failed) failed = errAlert;
            $.ajax({method: "GET", url: url, timeout: requestTimeout, data: data}).then(success, failed);
        },
        put: function (url, data, success, failed) {
            if (!failed) failed = errAlert;
            $.ajax({method: "PUT", url: url, timeout: requestTimeout, data: data}).then(success, failed);
        },
        post: function (url, data, success, failed) {
            if (!failed) failed = errAlert;
            $.ajax({method: "POST", url: url, timeout: requestTimeout, data: data}).then(success, failed);
        }
    };

    Hantax = {
        goPage: function (p) {
            $("#page").val(p);
            $('#postForm').submit();
        },

        agreeAndSignup: function () {
            var agreed = $("#agree1").is(":checked") && $("#agree2").is(":checked");
            if (agreed) {
                document.getElementById("signup-form").submit();
            } else {
                alert("모든 항목에 동의해 주십시오.");
            }
        },

        agreeAndSubmitReport: function () {
            var agreed = $("#agree1").is(":checked") && $("#agree2").is(":checked");
            if (agreed) {
                document.getElementById('postForm').submit();
            } else {
                alert("모든 항목에 동의해 주십시오.");
            }
        },

        updateSubmitType: function (cardID) {
            var data = {};
            var inputElems = $('input.submit_type');
            var submitTypeCount = inputElems.length;
            for (var i = 0; i < submitTypeCount; i++) {
                var name = $(inputElems[i]).attr('name');
                var value = $(inputElems[i]).is(":checked");
                data[name] = value;
            }
            console.log(data);
            api.put("/api/card/submittype", {
                _csrf: $('#csrfToken').val(),
                cardID: cardID,
                submitType: data
            }, function (successResult) {
                // console.log(successResult);
                alert(successResult);
            });
        },

        updateSubmitted: function (cardID) {
            api.put("/api/card/submitted", {
                _csrf: $('#csrfToken').val(),
                cardID: cardID
            }, function (successResult) {
                alert(successResult);
                window.location.reload();
            });
        },

        drawCalculatorTable: function () {
            var table = $('#calculator_table');
            var isFull = table.attr('isfull') == "true";
            table.find("tr:gt(1)").remove();
            var percentages = [65, 70, 75, 80, 85, 90, 95];
            var displayCateArr = ["수입금액", "필요경비", "납부할 세액"];
            var redCates = {
                "종합소득금액": true,
                "산출세액": true,
                "납부할 세액": true
            };
            if (!isFull) { // draw full table
                table.attr("isfull", "true");
                displayCateArr = ["수입금액", "필요경비", "사업소득금액", "근로소득금액", "그외소득금액", "종합소득금액", "일반소득공제", "과세표준", "세율", "산출세액", "기납부세액", "기타세액공제", "근로세액공제", "납부할 세액"];
            } else { // draw simple table
                table.attr("isfull", "false")
            }
            var rowCount = 0;
            displayCateArr.map(function (cate) {
                var columnHtmlArr = ["<tr>", "<td class='bold'>" + cate + "</td>"];
                if (redCates[cate])
                    columnHtmlArr = ["<tr class='warning'>", "<td class='bold'>" + cate + "</td>"];
                percentages.map(function (rate) {
                    if (redCates[cate])
                        columnHtmlArr.push("<td id='" + rate + "_" + rowCount + "' class='bold text-danger'></td>");
                    else
                        columnHtmlArr.push("<td id='" + rate + "_" + rowCount + "'></td>");
                });
                columnHtmlArr.push("</tr>");
                table.append(columnHtmlArr.join(''));
                rowCount += 1;
            });
            Hantax.executeCalculator();
        },

        executeCalculator: function () {
            var isFull = $('#calculator_table').attr('isfull') == "true";
            var percentages = [65, 70, 75, 80, 85, 90, 95];
            var data = {};

            var idArr = ['income_amount', 'simple_rate', 'deduction_amount', 'tax_credit', 'paid_tax_amount', 'earned_income', 'other_income'];
            idArr.map(function (id) {
                if ($("#" + id).val())
                    data[id] = parseFloat(($("#" + id).val()).split(',').join(''));
                else
                    data[id] = 0
            });

            if (isFull) {
                percentages.map(function (number) {
                    if (number === "report")
                        return;
                    var percentage = number / 100;
                    var requiredExpense = (percentage * data.income_amount).toFixed(2);
                    var totalIncome = data.income_amount - (requiredExpense) + data.earned_income + data.other_income;
                    var taxRate = getTaxRate(totalIncome - data.deduction_amount);
                    var calculatedTax = getCalculatedTax(totalIncome - data.deduction_amount);
                    var earnedTaxCredit = getEarnedTaxCredit(calculatedTax, data.earned_income, totalIncome);
                    var chargedTax1 = Math.max(calculatedTax - data.paid_tax_amount - data.tax_credit - earnedTaxCredit, (-1) * data.paid_tax_amount).toFixed(2);

                    $("#" + number + "_0").text(commaSeparateNumber(Math.round(data.income_amount))); // 수입금액
                    $("#" + number + "_1").text(commaSeparateNumber(Math.round(requiredExpense)));   // 필요경비
                    $("#" + number + "_2").text(commaSeparateNumber(Math.round(data.income_amount - (requiredExpense)))); // 사업소득금액
                    $("#" + number + "_3").text(commaSeparateNumber(Math.round(data.earned_income))); // 근로소득금액
                    $("#" + number + "_4").text(commaSeparateNumber(Math.round(data.other_income)));  // 그외소득금액
                    $("#" + number + "_5").text(commaSeparateNumber(Math.round(totalIncome)));        // 종합소득금액
                    $("#" + number + "_6").text(commaSeparateNumber(Math.round(data.deduction_amount))); // 일반소득공제
                    $("#" + number + "_7").text(commaSeparateNumber(Math.round(totalIncome - data.deduction_amount))); // 과세표준
                    $("#" + number + "_8").text(taxRate + " %");  // 세율
                    $("#" + number + "_9").text(commaSeparateNumber(Math.round(calculatedTax)));        // 산출세액
                    $("#" + number + "_10").text(commaSeparateNumber(Math.round(data.paid_tax_amount))); // 기납부 세액
                    $("#" + number + "_11").text(commaSeparateNumber(Math.round(data.tax_credit)));      // 기타세액공제
                    $("#" + number + "_12").text(commaSeparateNumber(Math.round(earnedTaxCredit)));      // 근로세액공제
                    $("#" + number + "_13").text(commaSeparateNumber(Math.round(chargedTax1))); // 납부할 세액1
                });
            } else {
                percentages.map(function (number) {
                    if (number === "report")
                        return;
                    var percentage = number / 100;
                    var requiredExpense = (percentage * data.income_amount).toFixed(2);
                    var totalIncome = data.income_amount - (requiredExpense) + data.earned_income + data.other_income;
                    var taxRate = getTaxRate(totalIncome - data.deduction_amount);
                    var calculatedTax = getCalculatedTax(totalIncome - data.deduction_amount);
                    var earnedTaxCredit = getEarnedTaxCredit(calculatedTax, data.earned_income, totalIncome);
                    var chargedTax1 = Math.max(calculatedTax - data.paid_tax_amount - data.tax_credit - earnedTaxCredit, (-1) * data.paid_tax_amount).toFixed(2);

                    $("#" + number + "_0").text(commaSeparateNumber(Math.round(data.income_amount)));
                    $("#" + number + "_1").text(commaSeparateNumber(Math.round(requiredExpense)));
                    $("#" + number + "_2").text(commaSeparateNumber(Math.round(chargedTax1))); // 납부할 세액1
                });
            }
        },

        drawCalculatorTable2: function () {
            var table = $('#calculator_table');
            var isFull = table.attr('isfull') == "true";
            table.find("tr:gt(1)").remove();
            var percentages = [65, 70, 75, 80, 85, 90, 95];
            var displayCateArr = ["수입금액", "필요경비", "납부할 세액"];
            var redCates = {
                "종합소득금액": true,
                "산출세액": true,
                "납부할 세액": true
            };
            if (!isFull) { // draw full table
                table.attr("isfull", "true");
                displayCateArr = ["수입금액", "필요경비", "종합소득금액", "일반소득공제", "과세표준", "세율", "산출세액", "기납부세액", "납부할 세액"];
            } else { // draw simple table
                table.attr("isfull", "false")
            }
            var rowCount = 0;
            displayCateArr.map(function (cate) {
                var columnHtmlArr = ["<tr>", "<td class='bold'>" + cate + "</td>"];
                if (redCates[cate])
                    columnHtmlArr = ["<tr class='warning'>", "<td class='bold'>" + cate + "</td>"];
                percentages.map(function (rate) {
                    if (redCates[cate])
                        columnHtmlArr.push("<td id='" + rate + "_" + rowCount + "' class='bold text-danger'></td>");
                    else
                        columnHtmlArr.push("<td id='" + rate + "_" + rowCount + "'></td>");
                });
                columnHtmlArr.push("</tr>");
                table.append(columnHtmlArr.join(''));
                rowCount += 1;
            });
            Hantax.executeCalculator2();
        },

        executeCalculator2: function () {
            var isFull = $('#calculator_table').attr('isfull') == "true";
            var percentages = [65, 70, 75, 80, 85, 90, 95];
            var data = {earned_income: 0, other_income: 0};

            var idArr = ['income_business', 'income_free', 'client_family_count', 'tax_credit', 'paid_tax_amount', 'deduction_amount'];
            idArr.map(function (id) {
                if ($("#" + id).val())
                    data[id] = parseFloat(($("#" + id).val()).split(',').join(''));
                else
                    data[id] = 0
            });
            data.income_amount = data.income_business + data.income_free;
            data.deduction_amount += data.client_family_count * 1500000;

            if (isFull) {
                percentages.map(function (number) {
                    if (number === "report")
                        return;
                    var percentage = number / 100;
                    var requiredExpense = (percentage * data.income_amount).toFixed(2);
                    var totalIncome = data.income_amount - (requiredExpense) + data.earned_income + data.other_income;
                    var taxRate = getTaxRate(totalIncome - data.deduction_amount);
                    var calculatedTax = getCalculatedTax(totalIncome - data.deduction_amount);
                    var earnedTaxCredit = getEarnedTaxCredit(calculatedTax, data.earned_income, totalIncome);
                    var chargedTax1 = Math.max(calculatedTax - data.paid_tax_amount - data.tax_credit - earnedTaxCredit, (-1) * data.paid_tax_amount).toFixed(2);

                    $("#" + number + "_0").text(commaSeparateNumber(Math.round(data.income_amount))); // 수입금액
                    $("#" + number + "_1").text(commaSeparateNumber(Math.round(requiredExpense)));   // 필요경비
                    $("#" + number + "_2").text(commaSeparateNumber(Math.round(totalIncome)));        // 종합소득금액
                    $("#" + number + "_3").text(commaSeparateNumber(Math.round(data.deduction_amount))); // 일반소득공제
                    $("#" + number + "_4").text(commaSeparateNumber(Math.round(totalIncome - data.deduction_amount))); // 과세표준
                    $("#" + number + "_5").text(taxRate + " %");  // 세율
                    $("#" + number + "_6").text(commaSeparateNumber(Math.round(calculatedTax)));        // 산출세액
                    $("#" + number + "_7").text(commaSeparateNumber(Math.round(data.paid_tax_amount))); // 기납부 세액
                    $("#" + number + "_8").text(commaSeparateNumber(Math.round(chargedTax1))); // 납부할 세액1
                });
            } else {
                percentages.map(function (number) {
                    if (number === "report")
                        return;
                    var percentage = number / 100;
                    var requiredExpense = (percentage * data.income_amount).toFixed(2);
                    var totalIncome = data.income_amount - (requiredExpense) + data.earned_income + data.other_income;
                    var taxRate = getTaxRate(totalIncome - data.deduction_amount);
                    var calculatedTax = getCalculatedTax(totalIncome - data.deduction_amount);
                    var earnedTaxCredit = getEarnedTaxCredit(calculatedTax, data.earned_income, totalIncome);
                    var chargedTax1 = Math.max(calculatedTax - data.paid_tax_amount - data.tax_credit - earnedTaxCredit, (-1) * data.paid_tax_amount).toFixed(2);

                    $("#" + number + "_0").text(commaSeparateNumber(Math.round(data.income_amount)));
                    $("#" + number + "_1").text(commaSeparateNumber(Math.round(requiredExpense)));
                    $("#" + number + "_2").text(commaSeparateNumber(Math.round(chargedTax1))); // 납부할 세액1
                });
            }
        },

        drawChart: function () {
            // var labels = [60, 65, 70, 75, 80, 85, 90, 95];
            var labels = [65, 70, 75, 80, 85, 90, 95];
            var lineChartValues = [];
            var barChartValues = [];
            labels = labels.map(function (percentage) {
                if (percentage == 55 || percentage == 100) {
                    barChartValues.push("");
                    lineChartValues.push("");
                } else {
                    barChartValues.push(removeCommaNumber($("#" + percentage + "_1")[0].innerHTML));
                    lineChartValues.push(removeCommaNumber($("#" + percentage + "_2")[0].innerHTML));
                }
                return percentage + " %";
            });
            // var barChartData = {
            //     labels: labels,
            //     datasets: [
            //         {
            //             label: "필요경비",
            //             fillColor: "rgba(240,173,78,0.5)",   // 그래프 body
            //             strokeColor: "rgba(239,142,0,0.8)", // 그래프 테두리
            //             highlightFill: "rgba(230,160,40,0.75)",
            //             highlightStroke: "rgba(220,220,220,1)",
            //             pointHighlightStroke: "rgba(151,187,205,1)",
            //             data: barChartValues
            //         }
            //     ]
            // };
            // var barChartCTX = document.getElementById("chartCanvas1").getContext("2d");
            // window.myBar = new Chart(barChartCTX).BarAlt(barChartData, {
            //     tooltipTemplate: "<%=label%> : <%= commaSeparateNumber(value) %>",
            //     scaleLabel: "          <%=value%>",
            //     barShowStroke: true,
            //     responsive: true
            // });

            var lineChartData = {
                labels: labels,
                datasets: [
                    {
                        label: "소득금액",
                        fillColor: "rgba(151,187,205,0.2)",
                        strokeColor: "rgba(151,187,205,1)",
                        pointColor: "rgba(151,187,205,1)",
                        pointStrokeColor: "#acf",
                        pointHighlightFill: "red",
                        pointHighlightStroke: "rgba(151,187,205,1)",
                        data: lineChartValues
                    }
                ]
            };
            var lineChartCTX = document.getElementById("chartCanvas2").getContext("2d");
            window.myLine = new Chart(lineChartCTX).Line(lineChartData, {
                responsive: true,       // 반응형 여부
                scaleShowLabels: false, // Y축 값 표시여부
                showTooltips: false,    // 마우스 오버 시 값 표시여부
                tooltipTemplate: "<%=label%> : <%= commaSeparateNumber(value) %>", // 마우스 오버 표시값 포맷
                tooltipYPadding: 30,
                // tooltipXPadding: 6,
                // scaleLabel: "          <%=value%>",
                // ///Boolean - Whether grid lines are shown across the chart
                // scaleShowGridLines : false,
                // //String - Colour of the grid lines
                // scaleGridLineColor : "rgba(0,0,0,.05)",
                // //Number - Width of the grid lines
                // scaleGridLineWidth : 100,
                // //Boolean - Whether to show horizontal lines (except X axis)
                // scaleShowHorizontalLines: true,
                // //Boolean - Whether to show vertical lines (except Y axis)
                // scaleShowVerticalLines: false,
                // //Boolean - Whether the line is curved between points
                // bezierCurve : true,
                // //Number - Tension of the bezier curve between points
                // bezierCurveTension : 0.4,
                // //Boolean - Whether to show a dot for each point
                // pointDot : true,
                // //Number - Radius of each point dot in pixels
                // pointDotRadius : 4,
                // //Number - Pixel width of point dot stroke
                // pointDotStrokeWidth : 10,
                // //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
                // pointHitDetectionRadius : 20,
                // //Boolean - Whether to show a stroke for datasets
                // datasetStroke : true,
                // //Number - Pixel width of dataset stroke
                // datasetStrokeWidth : 2,
                // //Boolean - Whether to fill the dataset with a colour
                // datasetFill : true,
                //String - A legend template
                // legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
                onAnimationComplete: function () {
                    var ctx = this.chart.ctx;
                    ctx.font = this.scale.font;
                    ctx.fillStyle = this.scale.textColor;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";

                    this.datasets.forEach(function (dataset) {
                        dataset.points.forEach(function (points) {
                            // TODO Stroke Color setting
                            // console.log("POINT:",points);
                            // value position
                            var showVal = parseInt(points.value / 10000) + " 만";
                            if (points.label == "65 %") {
                                ctx.fillText(showVal, points.x + 10, points.y + 25);
                            } else if (points.label == "95 %") {
                                ctx.fillText(showVal, points.x - 10, points.y - 10);
                            } else {
                                ctx.fillText(showVal, points.x, points.y - 10);
                            }
                        });
                    })
                }
            });
        },

        addClientFamilyRow: function () {
            var selectHtmlArr = ["<select class='form-control' id='newClientFamily_relationship'>"];
            Object.keys(relationshipDic).map(function (val) {
                selectHtmlArr.push("<option value='" + val + "'>" + relationshipDic[val] + "</option>")
            });
            selectHtmlArr.push("</select>");
            var relationshipHtml = selectHtmlArr.join('');

            // Select Ver.
            var handicappedHtmlArr = [
                "<select class='form-control' id='newClientFamily_isHandicapped'>",
                "<option value='X'>X</option>",
                "<option value='O'>O</option>",
                "</select>"
            ];
            var handicappedHtml = handicappedHtmlArr.join('');

            $('#clientFamilyTable').append(
                "<tr>" +
                "<td><input id='newClientFamily_name' class='form-control' type='text' required /></td>" +
                "<td><input id='newClientFamily_nationalID' class='form-control' type='text' placeholder='주민번호를 \"-\"없이 입력해주세요' maxlength='14' required /></td>" +
                "<td>" + relationshipHtml + "</td>" +
                "<td>" + handicappedHtml + "</td>" +
                "<td><a href='#clientFamilyTable' id='newClientFamily_submit' onclick='Hantax.addClientFamily()' ><i class='fa fa-check text-success'></i></a></td>" +
                "</tr>"
            )
        },
        addClientFamily: function () {

            var nameElem = $('#newClientFamily_name');
            var nationalIDElem = $('#newClientFamily_nationalID');
            var relationshipElem = $('#newClientFamily_relationship');
            var isHandicappedElem = $('#newClientFamily_isHandicapped');
            var submitElem = $('#newClientFamily_submit');
            var data = {};
            data._csrf = $('#csrfToken').val();
            data.name = nameElem.val();
            data.national_id_front = nationalIDElem.val().slice(0, 6);
            data.national_id_back = nationalIDElem.val().slice(6);
            data.relationship = relationshipElem.val();
            data.is_handicapped = isHandicappedElem.val();

            if (data.national_id_front.length != 6) return alert("주민등록번호 앞 6 자리가 잘못되었습니다.");
            data.national_id_back = data.national_id_back.split('-').join('');
            if (data.national_id_back.length != 7) return alert("주민등록번호 뒷 7 자리가 잘못되었습니다.");

            api.post("/api/client-family", data, function (successResult) {
                console.log(successResult);
                var clientFamilyID = successResult.id;
                nameElem.parent().parent().attr('id', 'clientFamilyRow' + clientFamilyID);
                nameElem.parent().attr('id', 'clientFamily' + clientFamilyID + '_name');
                nameElem.parent().empty().html("<b>" + data.name + "</b>");
                nationalIDElem.parent().attr('id', 'clientFamily' + clientFamilyID + '_nationalID');
                nationalIDElem.parent().empty().text(data.national_id_front + " - *******");
                relationshipElem.parent().attr('id', 'clientFamily' + clientFamilyID + '_relationship');
                relationshipElem.parent().empty().text(relationshipDic[data.relationship]);
                isHandicappedElem.parent().empty().text(data.is_handicapped);
                submitElem.parent().attr('id', 'clientFamily' + clientFamilyID + '_manage');
                submitElem.parent().empty().html(
                    "<a href='#clientFamilyTable' onclick='Hantax.editClientFamily(" + clientFamilyID + ")'><i class='fa fa-pencil'></i></a>&nbsp;" +
                    "<a href='#clientFamilyTable' onclick='Hantax.deleteClientFamily(" + clientFamilyID + ")'><i style='color:red' class='fa fa-trash'></i></a>"
                );
                Hantax.addClientFamilyRow();
            })
        },
        editClientFamily: function (clientFamilyID) {
            var data = {};
            var nameColumn = $('#clientFamily' + clientFamilyID + '_name');
            var nidColumn = $('#clientFamily' + clientFamilyID + '_nationalID');
            var relationshipColumn = $('#clientFamily' + clientFamilyID + '_relationship');
            var handicapColumn = $('#clientFamily' + clientFamilyID + '_isHandicapped');
            var manageColumn = $('#clientFamily' + clientFamilyID + '_manage');

            data.name = nameColumn.text();
            // data.national_id_front = nidColumn.text();
            var national_id = nidColumn.text();
            data.national_id_front = national_id.split('-')[0].trim();
            // data.national_id_back = national_id.split('-')[1].trim();
            data.relationship = relationshipColumn.text();
            data.is_handicapped = handicapColumn.text();

            nameColumn.html("<input class='form-control' type='text' id='editClientFamily" + clientFamilyID + "_name' value='" + data.name + "' required />");
            nidColumn.html("<input class='form-control' type='text' placeholder='\"-\" 없이 입력해주세요' id='editClientFamily" + clientFamilyID + "nationalID' required maxlength='13' value='" + data.national_id_front + "'/>");

            var relationshipHtmlArr = ["<select class='form-control' id='editClientFamily" + clientFamilyID + "_relationship'><option value='" + getRelationshipVal(data.relationship) + "'>" + data.relationship + "</option>"];
            Object.keys(relationshipDic).map(function (val) {
                relationshipHtmlArr.push("<option value='" + val + "'>" + relationshipDic[val] + "</option>")
            });
            relationshipHtmlArr.push("</select>");
            relationshipColumn.html(relationshipHtmlArr.join(''));

            var handicappedHtmlArr = [
                "<select class='form-control' id='editClientFamily'" + clientFamilyID + "'_isHandicapped'>",
                "<option value='" + data.is_handicapped + "'>" + data.is_handicapped + "</option>",
                "<option value='X'>X</option>",
                "<option value='O'>O</option>",
                "</select>"
            ];
            var handicappedHtml = handicappedHtmlArr.join('');
            handicapColumn.html(handicappedHtml);

            manageColumn.html("<a href='#clientFamilyTable' onclick='Hantax.doneEditClientFamily(" + clientFamilyID + ")' ><i class='fa fa-check text-success'></i></a>")
        },

        doneEditClientFamily: function (clientFamilyID) {
            var data = {id: clientFamilyID, _csrf: $('#csrfToken').val()};
            data.name = $('#clientFamily' + clientFamilyID + '_name > input').val();
            var nationalID = $('#clientFamily' + clientFamilyID + '_nationalID > input').val();
            data.national_id_front = nationalID.slice(0, 6);
            data.national_id_back = nationalID.slice(6);
            data.relationship = $('#clientFamily' + clientFamilyID + '_relationship > select').val();
            data.is_handicapped = $('#clientFamily' + clientFamilyID + '_isHandicapped > select').val();

            if (data.national_id_front.length != 6) return alert("주민등록번호 앞 6 자리가 잘못되었습니다.");
            if (data.national_id_back.length > 0) { // 주민번호 뒷자리 수정 시,
                data.national_id_back = data.national_id_back.split('-').join('');
                if (data.national_id_back.length != 7) return alert("주민등록번호 뒷 7 자리가 잘못되었습니다.");
            }

            api.put("/api/client-family", data, function (successResult) {
                // api.put("/test/ok", data, function (successResult) {
                console.log(successResult);
                $('#clientFamily' + clientFamilyID + '_name').html("<b>" + data.name + "</b>");
                $('#clientFamily' + clientFamilyID + '_nationalID').html(data.national_id_front + " - *******");
                $('#clientFamily' + clientFamilyID + '_relationship').empty().text(relationshipDic[data.relationship]);
                $('#clientFamily' + clientFamilyID + '_isHandicapped').empty().text(data.is_handicapped);
                $('#clientFamily' + clientFamilyID + '_manage').empty().html(
                    "<a href='#clientFamilyTable' onclick='Hantax.editClientFamily(" + clientFamilyID + ")'><i class='fa fa-pencil'></i></a>&nbsp;" +
                    "<a href='#clientFamilyTable' onclick='Hantax.deleteClientFamily(" + clientFamilyID + ")'><i style='color:red' class='fa fa-trash'></i></a>"
                );
            })
        },
        deleteClientFamily: function (clientFamilyID) {
            var confirmed = window.confirm("정말 삭제하시겠습니까?");
            if (confirmed) {
                api.put("/api/client-family/delete", {
                    id: clientFamilyID,
                    _csrf: $('#csrfToken').val()
                }, function (successResult) {
                    $('#clientFamilyRow' + clientFamilyID).remove();
                })
            }
        },
        deleteAccount: function () {
            var confirmed = window.confirm("정말 삭제하시겠습니까?");
            if (confirmed) {
                document.getElementById("delAccountForm").submit();
            }
        },
        searchID: function () {
            var data = {_csrf: $('#csrfToken').val(), name: $('#name').val()};
            api.get("/api/account/clientid", data, function (successResult) {
                var htmlArr = ["<label>조회결과</label>"];
                if (successResult.client_ids.length === 0) {
                    $('#searchIDResult').empty();
                    alert('조회결과가 없습니다');
                } else {
                    successResult.client_ids.map(function (data) {
                        htmlArr.push("<br/>" + data);
                    });
                    $('#searchIDResult').empty().html(htmlArr.join(''));
                }

            });
        }
    };

    // Event Triggered
    $('input:radio').change(function () {
        var isSubmitType = startsWith($(this).attr("name"), "submit_type");
        var attachmentID = $(this).attr("attachment-id");
        if (isSubmitType && $.isNumeric(attachmentID)) {
            Hantax.updateSubmitType($(this).attr("csrf"), $(this).attr("attachment-id"), $(this).attr("value"));
        }
    });

    $('a.addClientFamily').click(function () {
        console.log($(this))
    });

    if ($('#clientFamilyEditList').length) {
        Hantax.addClientFamilyRow();
    }

    if ($('#calculator_table').length) {
        Hantax.drawCalculatorTable();
        // Hantax.executeCalculator();
    }

    if ($('#chartCanvas2').length) {
        Chart.types.Bar.extend({
            name: "BarAlt",
            draw: function () {
                Chart.types.Bar.prototype.draw.apply(this, arguments);

                var ctx = this.chart.ctx;
                ctx.save();
                // text alignment and color
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillStyle = this.options.scaleFontColor;
                // position
                var x = this.scale.xScalePaddingLeft * 0.22;
                var y = this.chart.height * 0.45;
                // change origin
                ctx.translate(x, y);
                // rotate text
                ctx.rotate(-90 * Math.PI / 180);
                ctx.fillText(this.datasets[0].label, 0, 0);
                ctx.restore();
            }
        });
        Chart.types.Line.extend({
            name: "LineAlt",
            draw: function () {
                Chart.types.Line.prototype.draw.apply(this, arguments);

                var ctx = this.chart.ctx;
                ctx.save();
                // text alignment and color
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillStyle = this.options.scaleFontColor;
                // position
                var x = this.scale.xScalePaddingLeft * 0.22;
                var y = this.chart.height * 0.45;
                // change origin
                ctx.translate(x, y);
                // rotate text
                ctx.rotate(-90 * Math.PI / 180);
                ctx.fillText(this.datasets[0].label, 0, 0);
                ctx.restore();
            }
        });
        Hantax.drawChart();
    }

    // smooth scroll
    $(function () {
        $('a[href*="#"]:not([href="#"])').click(function () {
            if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
                var target = $(this.hash);
                target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                if (target.length) {
                    $('html, body').animate({
                        scrollTop: target.offset().top
                    }, 200);
                    return false;
                }
            }
        });
    });

    // random phone no
    const randomPhoneNo = RANDOM_PHONE_NO_LIST[Math.floor(Math.random() * RANDOM_PHONE_NO_LIST.length)];
    $('.random_phone_no').text(randomPhoneNo);

});