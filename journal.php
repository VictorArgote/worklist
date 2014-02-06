<?php
/**
 * vim:ts=4:et
 * 
 * Copyright (c) 2013, CoffeeandPower Inc.
 * All Rights Reserved. 
 *
 * http://www.worklist.net
 */

ob_start();
require_once ("config.php");

Session::check();

$msg = '';

// is the user logged in?
if (isset($_SESSION['userid'])) {

    // have they just logged in and been redirected back? eliza wants to know
    if (isset($_SESSION['redirectFromLogin'])) {
        $msgLogin = "Hello, it's good to see you! Let me know if I can help you with anything.".
                    "Type '@faq Eliza' or just click my icon in the lower left corner of the chat.".
                    "~Love, Eliza";
        unset($_SESSION['redirectFromLogin']);
    }

    initSessionDataByUserId($_SESSION["userid"]);
}

// generate random token if none is already saved in session
if(isset($_SESSION['csrf_token'])) {
    $csrf_token = $_SESSION['csrf_token'];
} else {
    $csrf_token = md5(uniqid(rand(), TRUE));
    $_SESSION['csrf_token'] = $csrf_token;
}

require_once("helper/checkJournal_session.php");
require_once("chat.class.php");
require_once("crypt.php");

$query = (isset($_REQUEST['query'])) ? (int) $_REQUEST['query'] : '';

if(isset($_POST['submitbutton']))
    $chat->sendEntry($_POST['author'], $_POST['message']);

$entries_result = $chat->loadEntries(0, array('count' => '50', 'query' => $query));
$entries = $entries_result['entries'];
$author = '';
$username = '';
$is_runner = isset($_SESSION['is_runner']) ? $_SESSION['is_runner'] : 0;

$version = Utils::getVersion();

$user = new User();
if ($_SESSION['userid']) {
    $user->findUserById($_SESSION['userid']);
}

require_once('head.php');
?>
<link rel="stylesheet" type="text/css" href="css/budget.css" />
<link rel="stylesheet" type="text/css" href="css/journal.css" />
<link rel="stylesheet" type="text/css" href="css/userinfo.css" />
<link rel="stylesheet" type="text/css" href="css/favorites.css" />

<title>Chat - Worklist</title>
<script type="text/javascript">
var refresh = 5 * 1000;
var statusTimeoutId = null;
var lastStatus = 0;

function StopStatus() {
    if(statusTimeoutId) clearTimeout(statusTimeoutId);
    lastStatus = 20;
}
</script>
<script type="text/javascript">
    var is_runner = <?php echo $is_runner ?>;
    var queryStr = '<?php echo $query ?>';
    var currentTime = <?php echo time() ?>;
    var earliestDate = <?php echo outputForJS($chat->getEarliestDate()) ?>;
    var firstDate = <?php echo outputForJS(strtotime($entries[0]['date'])) ?>,
        lastDate = <?php echo outputForJS(strtotime($entries[count($entries)-1]['date'])-365*24*60*60); ?>,
        lastEntryDate = lastDate;
    var inThePresent = true;
    var lastId = <?php echo outputForJS($entries[count($entries)-1]['id']); ?>;
    <?php if (isset($_SESSION['userid'])): ?>
        var userId = <?php echo outputForJS($_SESSION['userid'], 0) ?>;
    <?php else: ?>
        var userId = 0;
    <?php endif; ?>
    <?php if (!empty($_SESSION['username'])): ?>
        var userName = '<?php echo outputForJS($_SESSION['username']) ?>';
    <?php else: ?>
        var userName = 'Guest';
    <?php endif; ?>
    var userIp = '<?php echo $_SERVER['REMOTE_ADDR']; ?>';
    var gotoDate = <?php echo  isset($_GET['goto']) ? strtotime($_GET['goto']) : (isset($_POST['goto']) ? strtotime($_POST['goto']) : '0'); ?>;
    var lastTouched = '<?php echo file_get_contents(JOURNAL_UPDATE_TOUCH_FILE); ?>';
    var latency_sample = '<?php echo LATENCY_SAMPLE; ?>';
    var csrf_token = '<?php echo $csrf_token; ?>';
    var addFromJournal = true;
    var journal = {
        reloadWindowTimer: <?php echo defined("RELOAD_WINDOW_TIMER") ? RELOAD_WINDOW_TIMER : 3600; ?>
    };
    <?php if ($_SESSION['userid']): ?>
        var soundSettings = new Array(
            <?php echo $user->getSound_settings() & JOURNAL_CHAT_SOUND ? '1' : '0'; ?>,
            <?php echo $user->getSound_settings() & JOURNAL_SYSTEM_SOUND ? '1' : '0'; ?>,
            <?php echo $user->getSound_settings() & JOURNAL_PING_SOUND ? '1' : '0'; ?>,
            <?php echo $user->getSound_settings() & JOURNAL_BOT_SOUND ? '1' : '0'; ?>,
            <?php echo $user->getSound_settings() & JOURNAL_EMERGENCY_ALERT ? '1' : '0'; ?>
        );
    <?php else: ?>
        var soundSettings = new Array(1, 1, 1, 1, 1);
    <?php endif; ?>
</script>
<script type="text/javascript" src="js/jquery.template.js"></script>
<script type="text/javascript" src="js/jquery.metadata.js"></script>
<script type="text/javascript" src="js/jquery.jeditable.min.js"></script>
<script type="text/javascript" src="js/ajaxupload.js"></script>
<script type="text/javascript" src="js/jquery_all.js"></script>
<script type="text/javascript" src="js/journal.js"></script>
<script type="text/javascript" src="js/skills.js"></script>
<!-- js template for file uploads -->
<?php require_once('dialogs/file-templates.inc'); ?>
<?php require_once('dialogs/budget-expanded.inc') ?>
<script type="text/javascript">
<?php
if (isset($error) && $error->getErrorFlag() == 1) {
    $msg = "";
    foreach($error->getErrorMessage() as $m) {
        $msg .= $m ." ";
    }
?>
    retryMessage = "@me <?php echo $msg;?>"
    if (retryMessage) {
        sendEntryRetry();
    }
<?php } ?>

    <?php if ( isset($msgLogin)): ?>
        $.modal.showMessage("<?php echo $msgLogin;?>", 'login', 10000);
    <?php endif; ?>
    // 10000 = 10 seconds
    var checkUserLoggedInTime = 10000;

    $(window).ready(function(){
        if($('#guestUser').val() == "0") {
            setTimeout("checkUserLoggedIn()",checkUserLoggedInTime);
        }
    });

    var checkUserLoggedIn = function(){
        $.getJSON('helper/getAuthenticated.php',function(res) {
            if(res.reload == '1') {
                window.location.reload( false );
            } else {
                setTimeout("checkUserLoggedIn()",checkUserLoggedInTime);
            }
        });
    };
</script>
<script type="text/javascript" src="js/userstats.js"></script>
<script type="text/javascript">
    $(document).ready(function() {
        $('#settingsButton').tooltip({fade: 250});
        $('input[name="attachment"]').tooltip({fade: 250});



        $('textarea#message-pane').bind('keydown keyup mousedown mouseup change', function(e) {
            if(e.keycode == 13) {
                setLocalTypingStatus(IDLE);
            } else {
                if ($(this).val() !== '') {
                    setLocalTypingStatus(TYPING);
                } else {
                    setLocalTypingStatus(IDLE);
                }
            }
        });
    });
</script>
<style>
#welcomeInside .chatBtn {
    color: #ffffff;
    background-position: -356px -89px;
}
</style>
</head>
<body>
<?php
    if( isset($_SESSION['userid']) )  {
        require_once("helper/popup-penalty.inc");
        require_once("helper/popup-guest-selector.inc");
        require_once("helper/popup-useritems.inc");
    } else {
        require_once("helper/popup-guest-message.inc");
    }
?>
<audio id="chatSoundPlayer" preload="auto">
    <source src="mp3/bubblepop.mp3" />
    <source src="mp3/bubblepop.ogg" />
</audio>
<audio id="systemSoundPlayer" preload="auto">
    <source src="mp3/plazzle.mp3" />
    <source src="mp3/plazzle.ogg" />
</audio>
<audio id="pingSoundPlayer" preload="auto">
    <source src="mp3/warble.mp3" />
    <source src="mp3/warble.ogg" />
</audio>
<audio id="botSoundPlayer" preload="auto">
    <source src="mp3/sweosh.mp3" />
    <source src="mp3/sweosh.ogg" />
</audio>
<audio id="emergencySoundPlayer" preload="auto">
    <source src="mp3/red_alert.mp3" />
    <source src="mp3/red_alert.ogg" />
</audio>
<?php require_once('header.php'); ?>
<!-- Popup for transfered info -->
<?php require_once('dialogs/budget-transfer.inc') ?>
<?php require_once('dialogs/popups-userstats.inc'); ?>
<?php require_once('dialogs/popup-fees.inc'); ?>
        <input type="hidden" id="guestUser" value="<?php echo empty($_SESSION['username']) ? 0  : 1; ?>" />
        <div id="container">
            <div id="left"></div>
            <div id="content">
                <div id="debug"></div>
                <div class="clear"></div>
                <div id="guideline">
                    <div id="left-container">
                        <div id="search-filter-wrap" class="search">
                            <form id="searchForm" method="post">
                                <div class="input_box">
                                    <div class="searchDiv">
                                        <input id="query" type="text" value="" size="20" alt="Chat history..." name="query">
                                        <div id="search_reset" class="crossSearch" title="Clear Search Parameters"></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div id="online-users">
                            <h3>Who's here?</h3>
                            <div></div>
                        </div>
                    </div>
                    <div id="center-container">
                        <div id="entries">
                            <?php echo $chat->formatEntries($entries); ?>
                        </div>
                        <div id="bottom-panel">
                            <form method="POST" id="msgSubmit">
                                <div id="bottom_contain">
                                    <div id="bottom_left">
                                        <div id="buttons">
                                            <div id="settingsButton" onClick="initSound();" title="Chat Settings" >
                                                <img src="images/gif.gif" width="33" height="23" id="settingsSwitch" align="bottom" />
                                            </div>
                                            <div id="uploadButton" title="Upload to Chat">
                                                <?php
                                                if (isset($_SERVER['HTTP_USER_AGENT']) && strpos($_SERVER['HTTP_USER_AGENT'], "iPhone")) {
                                                    if(! isset($_SESSION['userid'])) {
                                                        $alt = "alert('Error uploading file: You need to be logged in to upload a file')";
                                                        echo '<a href="javascript:void(0)" onclick="' . $alt . '">';
                                                    } else {
                                                        $enc_id = vEncrypt($_SESSION['userid']);
                                                        echo '<a href="mailto:' . JOURNAL_PICTURE_EMAIL_PREFIX . '+' . $enc_id . JOURNAL_PICTURE_EMAIL_DOMAIN . '?subject=new image">';
                                                    }
                                                }
                                                ?>
                                                <img id="camera_icon" src="images/gif.gif" />
                                                <?php
                                                if (strpos($_SERVER['HTTP_USER_AGENT'], "iPhone")) {
                                                    echo '</a>';
                                                }
                                                ?>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="bottom_right">
                                        <textarea name="message-pane" id="message-pane"></textarea>
                                        <input type="hidden" value="<?php echo $author; ?>" name="author" id="author" />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div id="right-container">
                        <div id="penalty-container">
                            <div id="penalty-message">
                                <h2>You have been sent to Penalty Box</h2>
                                Time until you can chat again:
                            </div>
                            <div id="penalty-countdown">
                            </div>
                            <div id="penalty-descriptions">
                                <h3>Reasons given:</h3>
                            </div>
                        </div>
                        <div id="system-notifications">
                            <h3>System Notifications</h3>
                            <div></div>
                        </div>
                        <div id="current-jobs">
                            <div id="need-review">
                                <h3>Ready for Code Review</h3>
                                <ul></ul>
                            </div>
                            <p id="biddingJobs">
                                There <span>are</span>
                                <a target="_blank" href="<?php echo WORKLIST_URL; ?>worklist.php?project=&user=0&status=bidding">no jobs</a>
                                you can bid on
                            </p>
                            <?php if (isset($_SESSION['userid'])): ?>
                                <a title="Suggest a Feature or Report a Bug" id="addJobButton" href="addjob.php" target="_blank">Add job</a>
                            <?php endif; ?>
                        </div>
                    </div>
                    <img src="images/throbber_white_32.gif" id="loading-spin" />
                </div><!-- /#guideline -->
            </div><!-- /#content -->
            <div id="right"></div>
            <div style="clear: both;"></div>
            <div id="attachment-popup"></div>
        </div><!-- /#container -->
        <div style="clear: both"></div>

        <div id="loginbox" style="display: none;"></div>
        <div id="SettingsWindow"
            style="display: none;opacity: 1;"
            class="ui-dialog ui-widget ui-widget-content ui-corner-all white-theme ui-draggable ui-resizable"
            tabindex="-1" role="dialog">
            <div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">
                <span class="ui-dialog-title">Settings and Information</span>
                <a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" id="SettingsWindowClose">
                    <span class="ui-icon ui-icon-closethick">close</span>
                </a>
            </div>
            <div id="botHelper">
                <h2>Chat commands</h2>
                <p>
                    <a href="#" class="botlink" title="Command: @me status [message]" data="@me help status">How do i set my status?</a>
                    <a href="#" class="botlink" title="Command: @me away [message]" data="@me help away">How do I set myself away?</a>
                    <a href="#" class="botlink" title="Command: @ping [user] [message]" data="@ping hello">How do I ping someone?</a>
                    <a href="#" class="botlink" title="Command: @love [to] [why]" data="@love help">How do I send love?</a>
                    <a href="#" class="botlink" title="Command: @alert add [keyword]" data="@alert help">How do I add an alert?</a>
<?php
    foreach(bot::getBotList() as $thebot) {
        $bot = $thebot->respondsTo();
        if (in_array($bot, array('ping', 'alert'))) {
            continue;
        }
        echo "<a href=\"#\" class=\"botlink notTop\" title=\"Command: @{$bot} help\" data=\"@faq {$bot}\">What can I use $bot for?</a> ";
    }
?>

                    <a href="#" class="morebotlinks">See more commands</a>
                </p>
            </div>
            <form id="audiosetter" action="" method="post">
                <h2>Audio Settings</h2>
                <ul>
                    <li>
                        <span style="cursor:pointer;text-decoration:underline;" onClick="chatSound.play();">Chat Sound</span>
                        <label class="on">ON <input id="chataudioon" name="chataudio" type="radio" onClick="ChatAudioOn();"></label>
                        <label class="off">OFF <input id="chataudiooff" name="chataudio" type="radio" onClick="ChatAudioOff();"/></label>
                    </li>
                    <li>
                        <span style="cursor:pointer;text-decoration:underline;" onClick="systemSound.play();">System Sound</span>
                        <label class="on">ON <input id="systemaudioon" name="systemaudio" type="radio" onClick="SystemAudioOn();"> </label>
                        <label class="off">OFF <input id="systemaudiooff" name="systemaudio" type="radio" onClick="SystemAudioOff();"> </label>
                    </li>
                    <li>
                        <span style="cursor:pointer;text-decoration:underline;" onClick="pingSound.play();">Ping Sound</span>
                        <label class="on">ON <input id="pingaudioon" name="pingaudio" type="radio" onClick="PingAudioOn();"> </label>
                        <label class="off">OFF <input id="pingaudiooff" name="pingaudio" type="radio" onClick="PingAudioOff();"> </label>
                    </li>
                    <li>
                        <span style="cursor:pointer;text-decoration:underline;" onClick="botSound.play();">Bot Sound</span>
                        <label class="on">ON <input id="botaudioon" name="botaudio" type="radio" onClick="BotAudioOn();"> </label>
                        <label class="off">OFF <input id="botaudiooff" name="botaudio" type="radio" onClick="BotAudioOff();"> </label>
                    </li>
<?php
    // @TODO - Discuss: Allow for emergency audio to be flipped on and off by choice?
?>
                    <li>
                        <span style="cursor:pointer;text-decoration:underline;" onClick="emergencySound.play();">Emergency Alert</span>
                        <label class="on">ON <input id="emergencyaudioon" name="emergencyaudio" type="radio" onClick="EmergencyAudioOn();"> </label>
                        <label class="off">OFF <input id="emergencyaudiooff" name="emergencyaudio" type="radio" onClick="EmergencyAudioOff();"> </label>
                    </li>
                </ul>
            </form>
            <div class="ui-resizable-handle ui-resizable-n" style=""></div>
            <div class="ui-resizable-handle ui-resizable-e" style=""></div>
            <div class="ui-resizable-handle ui-resizable-s" style=""></div>
            <div class="ui-resizable-handle ui-resizable-w" style=""></div>
            <div class="ui-resizable-handle ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se ui-icon-grip-diagonal-se" style="z-index: 1001;"></div>
            <div class="ui-resizable-handle ui-resizable-sw" style="z-index: 1002;"></div>
            <div class="ui-resizable-handle ui-resizable-ne" style="z-index: 1003;"></div>
            <div class="ui-resizable-handle ui-resizable-nw" style="z-index: 1004;"></div>
        </div>


    <script type="text/javascript">
    $(function () {
        if ($('#fees-week').length > 0) {
            $('#fees-week').parents("tr").click(function() {
                var author = "Guest";
                if($('#user').length > 0) {
                    author = $('#user').html();
                }
                var t = 'Weekly fees for '+author;
                $('#wFees').dialog({
                    autoOpen: false,
                    dialogClass: 'white-theme',
                    title: t,
                    show: 'fade',
                    hide: 'fade'
                });
                $('#wFees').dialog( "option", "title", t );
                $('#wFees').html('<img src="images/loader.gif" />');
                $('#wFees').addClass('table-popup');
                $('#wFees').dialog('open');
                $.getJSON('api.php?action=getFeeSums&type=weekly', function(json) {
                    if (json.error == 1) {
                        $('#wFees').html('Some error occured or you are not logged in.');
                    } else {
                      $('#wFees').html(json.output);
                    }
                });
            });
        }

        if($('#fees-month').length > 0){
            $('#fees-month').parents("tr").click(function() {
                var author = "Guest";
                if ($('#user').length > 0) {
                    author = $('#user').html();
                }
                var t = 'Monthly fees for '+author;
                $('#wFees').dialog({
                    autoOpen: false,
                    dialogClass: 'white-theme',
                    title: t,
                    show: 'fade',
                    hide: 'fade'
                });
                $('#wFees').dialog("option", "title", t);
                $('#wFees').html('<img src="images/loader.gif" />');
                $('#wFees').addClass('table-popup');
                $('#wFees').dialog('open');
                $.getJSON('api.php?action=getFeeSums&type=monthly', function(json) {
                    if (json.error == 1) {
                        $('#wFees').html('Some error occured or you are not logged in.');
                    } else {
                        $('#wFees').html(json.output);
                    }
                });
            });
        }
    });

    $('#welcomeInside .earningsBtn').click(function() {
        $.get('api.php?action=getFeeSums', function(data) {
            var sum = eval('('+data+')');
            if (typeof sum != 'object') {
                return false;
            }
            $('#fees-week').html ('$'+sum.week);
            $('#fees-month').html ('$'+sum.month);
        });
    });
    </script>
<?php
    $inJournal = true;
    include("footer.php");
?>

