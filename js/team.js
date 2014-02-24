var current_sortkey = 'earnings30';
var current_order = false;
var sfilter = '30'; // Default value for the filter
var show_actives = "FALSE";
var show_myfavorites = "FALSE";

$(document).ready(function() {

// Set the users with fees in X days label
    $('.select-days').html(sfilter + ' days');

    getFavoriteUsers();

    fillUserlist(current_page);

    $('.ln-letters a').click(function(){
        var classes = $(this).attr('class').split(' ');
        current_letter = classes[0];
        fillUserlist(1);
        return false;
    });

    //table sorting thing
    $('.table-userlist thead tr th').hover(function(e){
        if(!$('div', this).hasClass('show-arrow')){
            if($(this).data('direction')){
                $('div', this).addClass('arrow-up');
            }else{
                $('div', this).addClass('arrow-down');
            }
        }
    }, function(e){
        if(!$('div', this).hasClass('show-arrow')){
            $('div', this).removeClass('arrow-up');
            $('div', this).removeClass('arrow-down');
        }
    });

    $('.table-userlist thead tr th').data('direction', false); //false == desc order
    $('.table-userlist thead tr th').click(function(e){
        $('.table-userlist thead tr th div').removeClass('show-arrow');
        $('.table-userlist thead tr th div').removeClass('arrow-up');
        $('.table-userlist thead tr th div').removeClass('arrow-down');
        $('div', this).addClass('show-arrow');
        var direction = $(this).data('direction');

        if(direction){
            $('div', this).addClass('arrow-up');
        }else{
            $('div', this).addClass('arrow-down');
        }

        var data = $(this).metadata();
        if (!data.sortkey) return false;
        current_sortkey = data.sortkey;
        current_order = $(this).data('direction');
        fillUserlist(current_page);

        $('.table-userlist thead tr th').data('direction', false); //reseting to default other rows
        $(this).data('direction',!direction); //switching on current
    }); //end of table sorting

    // Enable filter for users with fees in the last X days
    $('#filter-by-fees').click(function() {
        current_page = 1;
        if (show_actives == "FALSE") {
            show_actives = "TRUE";
            fillUserlist(current_page);
        } else {
            show_actives = "FALSE";
            fillUserlist(current_page);
        }
    });

    // Select users with fees in XX days
    $('#days').change(function() {
        // Set the days filter
        sfilter = $('#days option:selected').val();

        // If the filter is active reload the list
        if (show_actives === "TRUE") {
            fillUserlist(current_page);
        }
    });

    // Enable filter for my favorite users
    $('#filter-by-myfavorite').click(function() {
        current_page = 1;
        if (show_myfavorites == "FALSE") {
            show_myfavorites = "TRUE";
            fillUserlist(current_page);
        } else {
            show_myfavorites = "FALSE";
            fillUserlist(current_page);
        }
    });

    $("#query").autocomplete({
        minLength: 0,
        source: function(request, response) {
            $.ajax({
                cache: false,
                url: 'api.php',
                data: {
                    action: 'getUsersList',
                    startsWith: request.term
                },
                dataType: 'json',
                success: function(users) {
                    response($.map(users, function(item) {
                        return {
                            id: item.id,
                            nickname: item.nickname,
                        }
                    }));
                }
            });
        },
        focus:function(event, ui) {
            return false;
        },
        select:function(event, ui) {
            $("#query").val("");
            $("#search_user-id").val(ui.item.id);
            window.open('./user/' + ui.item.id, '_blank');

            return false;
        }
    }).data("autocomplete")._renderItem = function(ul, item) {
        return $("<li></li>")
            .data("item.autocomplete", item)
            .append("<a>" + item.nickname + "</font></a>").appendTo(ul);
    }
    if (showUserLink) {
        window.open(showUserLink, '_blank');
    }
    
    $("#query").DefaultValue("Search team...");
    $('#days').comboBox();
});

function fillUserlist(npage) {
    current_page = npage;
    var order = current_order ? 'ASC' : 'DESC';
    $.ajax({
        type: "POST",
        url: 'api.php',
        data: {
            'action': 'getUserList',
            'letter': current_letter,
            'page': npage,
            'order': current_sortkey,
            'order_dir': order,
            'sfilter': sfilter,
            'active': show_actives,
            'myfavorite': show_myfavorites
        },
        dataType: 'json',
        success: function(json) {

            $('.ln-letters a').removeClass('ln-selected');
            $('.ln-letters a.' + current_letter).addClass('ln-selected');

            var page = json[0][1]|0;
            var cPages = json[0][2]|0;

            $('.row-userlist-live').remove();

            if (json.length > 1) {
                $('.table-hdng').show();
                $('#message').hide();
            }else{
                $('.table-hdng').hide();
                $('#message').show();
            }

            var odd = true;
            for (var i = 1; i < json.length; i++) {
                AppendUserRow(json[i], odd);
                odd = !odd;
            }

            $('tr.row-userlist-live').click(function(){
                var match = $(this).attr('class').match(/useritem-\d+/);
                var userid = match[0].substr(9);
                window.open('./user/' + userid, '_blank');
                return false;
            });

            if (cPages > 1) { //showing pagination only if we have more than one page
                $('.ln-pages').html('<span>' + outputPagination(page, cPages) + '</span>');
                $('.ln-pages a').click(function() {
                    page = $(this).attr('href').match(/page=\d+/)[0].substr(5);
                    fillUserlist(page);
                    return false;
                });
            } else {
                $('.ln-pages').html('');
            }
        },
        error: function(xhdr, status, err) {}
    });
}

function AppendUserRow(json, odd) {
    var row;
    var pre = '';
    var post = '';

    var is_myfavorite = $.inArray(json.id, favoriteUsers) != -1;
    var favorite_div = '<div class="favorite_user myfavorite" title="Remove ' + json.nickname + ' as someone you trust. (don\'t worry it\'s anonymous)">&nbsp;</div>';

    row = '<tr class="row-userlist-live ';
    if (odd) {
        row += 'rowodd';
    } else {
        row += 'roweven';
    }

    if (is_myfavorite) {
        row += ' favorite';
    }

    row += ' useritem-' + json.id + '">';
    row += '<td class="name-col">' + (is_myfavorite ? favorite_div : '') + json.nickname + '</td>';
    row += '<td class="age">'+ json.joined + '</td>';
    row += '<td class="jobs money moneyPadding">' + json.jobs_count + '</td>';
    row += '<td class="money moneyPadding">' + json.budget + '</td>';
    row += '<td class="money moneyPadding">$' +addCommas(json.earnings.toFixed(2)) + '</td>';
    row += '<td class="money moneyPadding">$' + addCommas(json.earnings30) + '</td>';
    row += '<td class="money moneyPadding">(' + (Math.round((parseFloat(json.rewarder) / (parseFloat(json.earnings) + 0.000001)) * 100*100)/100)+ '%) $' + addCommas(json.rewarder) +  '</td>';
    $('.table-userlist tbody').append(row);

    var favorite_user_id = json.id;
    var favorite_user_nickname = json.nickname;
    if (is_myfavorite) {
        $('tr.favorite.useritem-' + favorite_user_id + ' .favorite_user.myfavorite').click(function (e) {
            if (!confirm('Are you sure you want to remove ' + favorite_user_nickname + ' as someone you trust?')) {
                return false;
            }
            $.ajax({
                type: 'POST',
                url: 'api.php',
                data: {
                    action: 'setFavorite',
                    favorite_user_id: favorite_user_id,
                    newVal: 0
                },
                dataType: 'json',
                success: function(json) {
                    if ((json === null) || (json.error)) {
                        var message="Error returned - f1. ";
                        if (json !== null) {
                            message = message + json.error;
                        }
                        alert(message);
                        return;
                    }
                }
            });
            getFavoriteUsers();
            fillUserlist(current_page);
            return false;
        });
    }
}

function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}