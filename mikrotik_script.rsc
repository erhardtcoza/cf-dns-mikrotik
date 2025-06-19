:local identity [/system identity get name]
:set identity [:toarray $identity]
:local safeName ""
:foreach c in=$identity do={
  :if ($c = " ") do={ :set safeName ($safeName . "_") } else={ :set safeName ($safeName . $c) }
}
:local dnsName "$safeName.ix.vinetdns.co.za"

:local rawIP [/tool fetch url="http://ipinfo.io/ip" output=user as-value]
:local ipData ($rawIP->"data")
:local currentIP [:pick $ipData 0 [:len $ipData]]

:local jsonBody ("{\\\"ip\\\":\\\"" . $currentIP . "\\\",\\\"name\\\":\\\"" . $dnsName . "\\\"}")

/tool fetch url="https://ix.vinetdns.co.za/" \\
  http-method=post \\
  http-header-field="Content-Type: application/json" \\
  http-data=$jsonBody \\
  output=none
