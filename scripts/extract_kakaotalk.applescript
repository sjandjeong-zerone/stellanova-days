-- StellaNova Days - KakaoTalk Extractor
-- Extracts today's messages from the frontmost KakaoTalk chat window

on run
	set todayDate to do shell script "date '+%Y-%m-%d'"
	set todayFormatted to formatKoreanDate(todayDate)
	
	tell application "System Events"
		tell process "KakaoTalk"
			set frontmost to true
			delay 0.5
			
			-- Get the chat window
			set chatWindow to first window
			
			-- Scroll to top to find today's messages
			-- (we'll scroll and collect text)
			
			-- Select all text in the chat area
			try
				-- Click on the chat area first
				set chatArea to first group of first group of chatWindow
				click chatArea
				delay 0.3
				
				-- Use keyboard shortcut to select all
				keystroke "a" using command down
				delay 0.3
				keystroke "c" using command down
				delay 0.3
			on error errMsg
				return "ERROR: Could not select chat content - " & errMsg
			end try
			
			-- Get clipboard content
			set chatContent to (the clipboard as text)
		end tell
	end tell
	
	-- Save to file
	set outputDir to (POSIX path of (path to home folder)) & ".hermes/cache/"
	do shell script "mkdir -p " & quoted form of outputDir
	
	set outputFile to outputDir & "kakaotalk_" & todayDate & ".txt"
	
	-- Filter for today's messages and save
	set filteredContent to filterTodayMessages(chatContent, todayFormatted)
	do shell script "echo " & quoted form of filteredContent & " > " & quoted form of outputFile
	
	return "✓ Saved " & (count paragraphs of filteredContent) & " lines to " & outputFile
end run

on formatKoreanDate(dateStr)
	-- Convert YYYY-MM-DD to Korean format for matching in chat
	set AppleScript's text item delimiters to "-"
	set dateParts to text items of dateStr
	set y to item 1 of dateParts
	set m to item 2 of dateParts as integer
	set d to item 3 of dateParts as integer
	set AppleScript's text item delimiters to ""
	
	return ("" & y & "년 " & m & "월 " & d & "일")
end formatKoreanDate

on filterTodayMessages(content, datePattern)
	set filtered to ""
	repeat with para in paragraphs of content
		if para contains datePattern or para is "" then
			set filtered to filtered & para & "\n"
		end if
	end repeat
	return filtered
end filterTodayMessages