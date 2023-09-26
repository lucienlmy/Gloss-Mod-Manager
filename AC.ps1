$selfSignedCert = New-SelfSignedCertificate -DnsName "3DMGAME" -CertStoreLocation "cert:\CurrentUser\My\" -NotAfter (Get-Date).AddYears(10) -FriendlyName "Gloss Mod Manager" -KeyUsage DigitalSignature -KeySpec Signature -HashAlgorithm SHA256 -KeyLength 2048 -KeyAlgorithm RSA -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")
$mypwd = ConvertTo-SecureString -String "MUGqwPYqBD7QY2c3p7hWqhsB8cg8cSNPNNS3dr3gJ9a2H3stI1" -Force -AsPlainText
Export-PfxCertificate -cert $selfSignedCert.PSPath -FilePath ".\.key\gmm.pfx" -Password $mypwd
