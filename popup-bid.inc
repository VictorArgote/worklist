    <div id="popup-bid" class="popup-body" title = "Place Bid">
            <table width="100%" class="table-bidlist">
                <thead>
                <tr class="table-hdng" >
                    <td>Email</td>
                    <td>Bid Amount</td>
                    <td>Done In</td>
                    <td>Age</td>
                </tr>
                </thead>
                <tbody>
                </tbody>
            </table><br />
            <form name="popup-form" action="" method="post">
                <input type="hidden" name="itemid" value="" />
    
                <p class="info-label">Bid Amount<br />
                <input type="text" name="bid_amount" id="bid_amount" class="text-field money" size="48" />
                </p>
    
    			<div class="w9notice"></div>
    
                <p class="info-label">Done By<br />
                  <input type="text" class="text-field date" name="done_by" id="done_by" value="" size="20" />
                  <img src="images/Calendar.gif" class="dpButtonCal" onClick="displayDatePicker('done_by', false, 'mdy', '/');" /> 
                  <img src="images/transparent.gif" width="30px" height="1" id="done_by_button"/>
                </p>

                <script type="text/javascript">
                    // see http://regexlib.com/REDetails.aspx?regexp_id=318
                    var regex_bid = /^\$?(\d{1,3},?(\d{3},?)*\d{3}(\.\d{0,2})?|\d{1,3}(\.\d{0,2})?|\.\d{1,2}?)$/;
                    var regex_date = /^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} (am|pm)$/;

                    var bid_amount = new LiveValidation('bid_amount',{ onlyOnSubmit: true });
                        bid_amount.add( Validate.Presence, { failureMessage: "Can't be empty!" });
                        bid_amount.add( Validate.Format, { pattern: regex_bid, failureMessage: "Invalid Input!" });

                    var done_by = new LiveValidation('done_by',{ insertAfterWhatNode: 'done_by_button', onlyOnSubmit: true });
                        done_by.add( Validate.Presence, { failureMessage: "Can't be empty!" });
                        done_by.add( Validate.Format, { pattern: regex_date, failureMessage: "Invalid Input!" });
                </script>

                <p class="info-label">Notes<br />
                <textarea name="notes" size="48" /></textarea>
                </p>

<?php
       if($is_runner)
       {
?>
	 <p class="info-label">Mechanic<br/>
       	 <select name='mechanic_id' id='mechanic_id'>
<?php
	 $user_array = GetUserList($_SESSION['userid'], $_SESSION['nickname']);

	 foreach($user_array as $user_record)
	 {
	   if(!empty($filter_name) && $_SESSION[$filter_name] == $user_record['userid'])
	   {
	     echo "<option value='{$user_record['userid']}' selected='selected'>{$user_record['nickname']}</option>\n";
	   }
	   else
	   {
	     echo "<option value='{$user_record['userid']}'>{$user_record['nickname']}</option>\n";
	   }
	 }
?>
	 </select></p>

<?php   } else  {  ?>

	 <p class="info-label">Mechanic<br />
	   <span id="mechanic_id"><?php echo !empty($_SESSION['nickname']) ? $_SESSION['nickname'] : ''; ?></span>
	 </p>
         <input type='hidden' name='mechanic_id' id='mechanic_id' value='<?php echo !empty($_SESSION['userid']) ? $_SESSION['userid'] : ''; ?>' />

<?php   }  ?>
    
                <br/><input type="submit" id="bid" name="place_bid" value="Place Bid" />
            </form>
    </div><!-- end of popup-bid -->