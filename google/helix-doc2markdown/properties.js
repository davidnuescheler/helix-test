function updateProperties() {
  var scriptProperties = PropertiesService.getScriptProperties();
  // set the correct Azure 'sas' here in url encoded format. 
  scriptProperties.setProperty('AZURE_BLOB_SAS', '?sv=2018-03-28&ss=bfqt&srt=sco&sp=rwdlacup&se=2020-02-19T07:54:26Z&st=2019-07-29T22:54:26Z&spr=https&sig=uv5%2Fxxxxxxxxxxxxxxxx%3D');
}

function testProps() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var f = scriptProperties.getProperty('foo');
  Logger.log(f);
}