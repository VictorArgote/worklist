var nclass;
var nickname, username, about, paypal, firstname, lastname, w9_accepted;

function completeUploadImage(file, data) {
    $('span.LV_validation_message.upload').css('display', 'none').empty();
    if (!data.success) {
        $('span.LV_validation_message.upload').css('display', 'inline').append(data.message);
    } else {
        window.location.reload();
    }
}

function validateNames(file, extension) {
    if (LiveValidation.massValidate( [ firstname, lastname ] )) {
        return validateW9Upload(file, extension);
    } else {
        return false;
    }
}

function validateW9Upload(file, extension) {
    nclass = '.uploadnotice-w9';
    return validateUpload(file, extension);
}
function validateUpload(file, extension) {
    if (! (extension && /^(pdf)$/i.test(extension))) {
        // extension is not allowed

        // Restore the styling of upload button
        $('#formupload').attr('value', 'upload W9');
        $('#formupload').removeClass('w9_upload_disabled');
        $('.w9_loader').css('visibility', 'hidden');

        $(nclass).empty();
        var html = '<div class="ui-state-error ui-corner-all">' +
                        '<p style="margin: 0;"><span style="float: left; margin-right: 0.3em;" class="ui-icon ui-icon-alert"></span>' +
                        '<strong>Error:</strong> This filetype is not allowed. Please upload a pdf file.</p>' +
                    '</div>';
        $(nclass).append(html);
        // cancel upload
        return false;
    }else{
        // Inform the user that the file is being uploaded...
        $(nclass).empty();
        $('#formupload').attr('value', 'uploading...');
        $('#formupload').addClass('w9_upload_disabled');
        $('.w9_loader').css('visibility', 'visible');
    }
}

function completeUpload(file, data) {
    $(nclass).empty();
    if (data.success) {
        // Restore the styling of upload button
        $('#formupload').attr('value', 'Success!');
        $('#formupload').removeClass('w9_upload_disabled');
        $('.w9_loader').css('visibility', 'hidden');

        var html = '<div style="padding: 0.7em; margin: 0.7em 0; width:285px;" class="ui-state-highlight ui-corner-all">' +
                        '<p style="margin: 0;"><span style="float: left; margin-right: 0.3em;" class="ui-icon ui-icon-info"></span>' +
                        '<strong>Info:</strong> ' + data.message + '</p>' +
                    '</div>';
        saveSettings('w9Name');
    } else {
        // Restore the styling of upload button
        $('#formupload').attr('value', 'Fail');
        $('#formupload').removeClass('w9_upload_disabled');
        $('.w9_loader').css('visibility', 'hidden');

        var html = '<div style="padding: 0.7em; margin: 0.7em 0; width:285px;" class="ui-state-error ui-corner-all">' +
                        '<p style="margin: 0;"><span style="float: left; margin-right: 0.3em;" class="ui-icon ui-icon-alert"></span>' +
                        '<strong>Error:</strong> ' + data.message + '</p>' +
                    '</div>';
        this.enable();
    }
    $(nclass).append(html);
}

function validateW9Agree(value) {
    if (! $('#w9_accepted').is(':checked') && $('#country').val() == 'US') {
        return false;
    }
    return true;
}

function isJSON(json) {
    json = json.replace(/\\["\\\/bfnrtu]/g, '@');
    json = json.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    json = json.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return (/^[\],:{}\s]*$/.test(json))
}
function confirm_or_clean_phone(values) {
    $.ajax({
        type: "POST",
        url: './settings',
        data: values,
        async:   false,

        success: function(json) {

            var phone_confirm_json = isJSON(json) ? jQuery.parseJSON(json) : null;

            if(values.confirm_phone) {

                if(phone_confirm_json && phone_confirm_json.phone_validated == true) {
                    $('#phone').data('last_confirmed_phone', $('#phone').val());
                    $('#popup-confirmphone').dialog('close');
                    Utils.infoDialog('Phone Confirmed', "Congratulations! You have successfully confirmed your phone.");
                    if($("#username").val() != sessionusername) {
                        alert('Please note that you have also modified your email.' +
                                ' \n After clicking on the confirm link in your email, \n please send yourself a test sms.' +
                        ' Thank you!');
                        $("#Confirm").removeData('email_edited');
                    }

                } else if(phone_confirm_json && !phone_confirm_json.phone_validated){
                    alert('Your phone confirm code does not match. Please try again.');
                }else {
                    alert('There was an error confirming your phone. Please try again.');
                }
             } else if(values.clean_phone) {
                if(phone_confirm_json.phone_cleaned) {
                    $('#phone').val('');
                    $('#phone').data('last_confirmed_phone','');
                    $('#popup-confirmphone').dialog('close');
                    Utils.infoDialog('Phone Reset', "You have successfully reset your phone settings.");
                } else {
                    alert("There was an error cleaning your phone settings. Please try again.");
                }
            }
        },

        error: function(xhdr, status, err) {
            $('#msg-'+type).text('We were unable to save your settings. Please try again.');
        }
    });

}

function DisplayConfirmPhoneDialog() {
    var dialog_options = { dialogClass: 'white-theme', autoOpen: false, modal: true, maxWidth: 800,
        width: 390, show: 'fade', hide: 'fade', resizable: false };
    $('#popup-confirmphone').dialog(dialog_options);
    $('#popup-confirmphone').dialog('open');
}
function GetPhoneValidation() {
    //if the phone was edited, we need to confirm it
    if($("#phone_edit").val() && jQuery.trim($('#phone').val()).length > 0 && $("#phone").val()
        != $("#phone").data('watermarkText') && $('#phone').data('last_confirmed_phone') !=
         $('#phone').val()) {
        var phone_value = $('#int_code').val() + $('#phone').val();
        values = {
                setConfirmString: 1,
                phone: phone_value
        };
        //ajax call to get phone confirm string
        $.ajax({
            type: "POST",
            url: './settings',
            data: values,
            async:   false,

            success: function(json) {
                var settings_json = isJSON(json) ? jQuery.parseJSON(json) : null;

                // check if phone is valid
                if(settings_json && settings_json.phoneInvalid) {
                    alert('You have entered an invalid phone number.');
                    return;
                }

                DisplayConfirmPhoneDialog();

            },

            error: function(xhdr, status, err) {
                alert('There was an error confirming your phone. Please try again.');
            }
        });
    } else {
        saveSettings('account');
    }

}
function saveSettings(type) {

    var values;
    if (type == 'account') {
        var massValidation = LiveValidation.massValidate( [ nickname, city, username ], true);
        // we need to account for the value of the watermark for the phone. There may be a bug in the plugin
        // so we adjust the phone no accordingly Teddy 25/Feb/13
        var phone_value = $('#int_code').val() + $('#phone').val();
        if($('#phone').val() == $("#phone").data('watermarkText')) {
            phone_value = '';
        }

        if (massValidation) {
            values = {
                int_code: $('#int_code').val(),
                phone: phone_value,
                phone_edit: $('#phone_edit').val(),
                country: $('#country').val(),
                city: $('#city').val(),
                smsaddr: ($('#smsaddr').val()),
                timezone: $('#timezone').val(),
                journal_alerts: $('#journal_alerts').prop('checked') ? 1 : 0,
                bid_alerts: $('#bid_alerts').prop('checked') ? 1 : 0,
                nickname: $('#nickname').val(),
                save_account: 1,
                username: $('#username').val(),
                my_bids_notify: $('input[name="my_bids_notify"]').prop('checked') ? 1 : 0,
                ping_notify: $('input[name="ping_notify"]').prop('checked') ? 1 : 0,
                review_notify: $('input[name="review_notify"]').prop('checked') ? 1 : 0,
                bidding_notify: $('input[name="bidding_notify"]').prop('checked') ? 1 : 0,
                my_review_notify: $('input[name="my_review_notify"]').prop('checked') ? 1 : 0,
                my_completed_notify: $('input[name="my_completed_notify"]').prop('checked') ? 1 : 0,
                self_email_notify: $('input[name="self_email_notify"]').prop('checked') ? 1 : 0,
                bidding_email_notify: $('input[name="bidding_email_notify"]').prop('checked') ? 1 : 0,
                review_email_notify: $('input[name="review_email_notify"]').prop('checked') ? 1 : 0
            };
        } else {
            // Validation failed. We use openNotifyOverlay to display messages
            var errorHtml = createMultipleNotifyHtmlMessages(LiveValidation.massValidateErrors);
            openNotifyOverlay(errorHtml, null, null, true);
            return false;
        }
    } else if (type == 'personal') {
        values = {
            about: $("#about").val(),
            skills: $("#skills").val(),
            contactway: $("#contactway").val(),
            save_personal: 1
        }
    } else if (type == 'payment') {
        var massValidation = LiveValidation.massValidate( [ paypal, w9_accepted ]);
        if (massValidation) {
            values = {
                paytype: $("#paytype").val(),
                paypal_email: $("#paypal_email").val(),
                payway: $("#payway").val(),
                save_payment: 1,
                w9_accepted: $('#w9_accepted').is(':checked')
            }
        } else {
            return false;
        }
    } else if (type == 'w9Name') {
        values = {
            first_name: $("#first_name").val(),
            last_name: $("#last_name").val(),
            save_w9Name: 1
        }
    }

    $('.error').text('');

    $.ajax({
        type: "POST",
        url: './settings',
        data: values,
        success: function(json) {

            var message = 'Account settings saved!';
            var settings_json = isJSON(json) ? jQuery.parseJSON(json) : null;
            if (settings_json && settings_json.error) {
                console.log(settings_json);
                if (settings_json.error == 1) {
                    message = "There was an error updating your information.<br/>Please try again or contact a Runner for assistance.<br/>Reason for failure: " + settings_json.message;
                } else {
                    message = json.message;
                }
            }

            if(settings_json.error == 1) {
                openNotifyOverlay(message,false,false,true); // Display with a red border id its an error
            } else {
                openNotifyOverlay(message);
            }
            
        },
        error: function(xhdr, status, err) {
            $('#msg-'+type).text('We were unable to save your settings. Please try again.');
        }
    });
}


function smsSendTestMessage() {
    var int_code = $('#int_code').val();
    var phone = $('#phone').val();
    if (int_code != '' && phone != '') {
        $.ajax({
            type: "POST",
            url: 'jsonserver.php',
            data: {
                action: 'sendTestSMS',
                phone: int_code + phone
            },
            dataType: 'json'
        });
        alert('Test SMS Sent to: ' + int_code + phone);
    } else {
        alert('Please enter a valid telephone number.');
    }
    return false;
}
function ChangePaymentMethod() {
    var paytype = $('#paytype').val();
    paypal.enable();
    // validation disabled: payway.enable();
    if (paytype == 'paypal') {
        $('#paytype-paypal').show();
        $('#paytype-other').hide();
    } else if (paytype == 'other') {
        $('#paytype-paypal').hide();
        $('#paytype-other').show();
    } else {
        $('#paytype-paypal').hide();
        $('#paytype-other').hide();
    }
}
$(document).ready(function () {
    $('#phone').data('last_confirmed_phone', $('#phone').val());
<?php if (isset($_REQUEST['ppconfirmed']) || isset($_REQUEST['emconfirmed'])) : ?>
    $('<div id="popup-confirmed"><div class="content"></div></div>').appendTo('body');

    <?php if (isset($_REQUEST['ppconfirmed'])){  ?>
        var $title = 'Your Paypal address was confirmed';
        var $content = 'Thank you for confirming your Paypal address.<br/><br/>You can now bid on items in the Worklist!<br/><br/><input style="" class="closeButton" type="button" value="Close" />';
    <?php } else { ?>
        var $title = 'Your email change is confirmed.';
        var $content = 'Thank you for confirming your changed email address.<br/><br/><input style="" class="closeButton" type="button" value="Close" />';
    <?php } ?>

    $('#popup-confirmed').dialog({
        dialogClass: "white-theme",
        modal: true,
        title: $title,
        autoOpen: true,
        width: 300,
        position: ['top'],
        open: function() {
            $('#popup-confirmed .content').html($content);
            $('#popup-confirmed .closeButton').click(function() {
                $('#popup-confirmed').dialog('close');
            });
        }
    });
<?php endif; ?>
    var pictureUpload = new AjaxUpload('profilepicture', {
        action: 'api.php',
        name: 'profile',
        data: { action: 'uploadProfilePicture', api_key: '<?php echo API_KEY; ?>', userid: '<?php echo $_SESSION['userid']; ?>' },
        autoSubmit: true,
        hoverClass: 'imageHover',
        responseType: 'json',
        onSubmit: validateUploadImage,
        onComplete: completeUploadImage
    });
    var user = <?php echo('"' . $_SESSION['userid'] . '"'); ?>;

    new AjaxUpload('formupload', {
        action: 'jsonserver.php',
        name: 'Filedata',
        data: { action: 'w9Upload', userid: user },
        autoSubmit: true,
        responseType: 'json',
        onSubmit: validateNames,
        onComplete: completeUpload
    });

    $("#w9-dialog").dialog({
        dialogClass: 'white-theme',
        resizable: false,
        width: 220,
        title: 'W9 form upload',
        autoOpen: false,
        position: ['top'],
        open: function() {
            <?php if (empty($_SESSION['new_user'])) {
                $firstName = $userInfo['first_name'];
                $lastName = $userInfo['last_name'];
            } else {
                $firstName = "";
                $lastName = "";
            }
            ?>
            $("#last_name").val('<?php echo $lastName ?>');
            $("#first_name").val('<?php echo $firstName ?>');
            $(".uploadnotice-w9").html('');
            $(".LV_validation_message").html('');
        }
    });

    $("#uploadw9").click(function() {
        $("#w9-dialog").dialog("open");
     });

    $.ajax({
        type: "POST",
        url: 'jsonserver.php',
        data: {
            action: 'isUSCitizen',
            userid: user
        },
        dataType: 'json',
        success: function(data) {
            if ((data.success === true) && (data.isuscitizen === true)) {
            $('#w9upload').show();
            }
        }
    });
    $('#popup-confirmphone').bind('dialogclose', function(event) {
        // If the dialog closed and phone is not confirmed,
        // then we need to revert back to old phone number in the #phone field
        if($('#phone').data('last_confirmed_phone') != $('#phone').val()) {
            $('#phone').val($('#phone').data('last_confirmed_phone'));
            $("#phone_edit").val('0');
        }
        saveSettings('account');
    });
    $("#Confirm").click(function() {

            values = {
                phone: $('#int_code').val() + $('#phone').val(),
                confirm_phone: 1,
                $phoneconfirmstr: $("#phoneconfirmstr").val()
            };
            confirm_or_clean_phone(values);
        return false;
    });

    $("#clean_phone_span").click(function() {
        values = {
            clean_phone: 1
        };
        confirm_or_clean_phone(values);
    });

    $("#send-test").click(smsSendTestMessage);
    $("#save_account").click(function() {
        GetPhoneValidation();
        return false;
    });
    $("#save_personal").click(function() {
        saveSettings('personal');
        return false;
    });
    $("#save_payment").click(function() {
        saveSettings('payment');
        return false;
    });

    nickname = new LiveValidation('nickname', {validMessage: "You have an OK Nickname." });
    nickname.add(Validate.Length, { minimum: 0, maximum: 25 } );
    nickname.add(Validate.Format, {pattern: /[@]/, negate:true});
    nickname.add(Validate.Exclusion, { within: [ 'Nickname' ], failureMessage: "You must set your Nickname!" });

    username = new LiveValidation('username', {validMessage: "Valid email address."});
    username.add( Validate.Email );
    username.add(Validate.Length, { minimum: 4, maximum: 50 } );
    username.add(Validate.Exclusion, { within: [ 'username' ], failureMessage: "You must set your Email!" });

    about = new LiveValidation('about');
    about.add(Validate.Length, { minimum: 0, maximum: 150 } );

    paypal = new LiveValidation('paypal_email', {validMessage: "Valid email address."});
    paypal.add(Validate.Email);
    // TODO: Review requirements here. We let people signup without paypal, and we let them delete their paypal
    // email, which removes their paypal verification and prevents them from bidding
    // paypal.add(Validate.Presence, { failureMessage: "Can't be empty!" });

    firstname = new LiveValidation('first_name', {validMessage: "First Name looks good", onlyOnBlur: true});
    firstname.add(Validate.Presence, { failureMessage: "Sorry, we need your first name before you can upload your W9. It’s only for administrative purposes and won’t be displayed in your profile"});
    firstname.add(Validate.Format, { pattern: /^[a-zA-Z]+$/, failureMessage: "Only characters through a-z and A-Z are allowed" });

    lastname = new LiveValidation('last_name', {validMessage: "Last Name looks good", onlyOnBlur: true});
    lastname.add(Validate.Presence, { failureMessage: "Sorry, we need your last name before you can upload your W9. It’s only for administrative purposes and won’t be displayed in your profile"});
    lastname.add(Validate.Format, { pattern: /^[a-zA-Z]+$/, failureMessage: "Only characters through a-z and A-Z are allowed" });

    w9_accepted = new LiveValidation('w9_accepted', {insertAfterWhatNode: 'w9_accepted_label'});
    w9_accepted.displayMessageWhenEmpty = true;
    w9_accepted.add(Validate.Custom, { against: validateW9Agree, failureMessage: "Oops! You forgot to agree that you'd keep us posted if you move. Please check the box, it's required, thanks!" });
    
    setTimeout('ChangePaymentMethod()', 2000);
});
