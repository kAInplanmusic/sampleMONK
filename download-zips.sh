#!/bin/bash
mkdir -p public/samples
mkdir -p temp_extract

echo "Downloading 1..."
wget -O 1.zip "https://p4.bcbits.com/download/album/1bb79c7ea14a28778bc99310e8a910836/wav/3739501757?id=3739501757&sig=c6bc7c23fecb21bba16f9158f75bbae9&sitem_id=393131985&token=1784922057_43cadaa01f6ff05a4c03a337edae6037354fda30"
echo "Downloading 2..."
wget -O 2.zip "https://p4.bcbits.com/download/album/119b21b46893f36b7d6f0b97cff627e5c/wav/121842118?id=121842118&sig=7df88d9ed4aab8852003dbc773b77f31&sitem_id=393131834&token=1784922053_f38a30f4287db8b52e2b648d098ec8d2fbe105d9"
echo "Downloading 3..."
wget -O 3.zip "https://p4.bcbits.com/download/album/1cd961acc5a6801b7f0911a97877cd802/wav/583700806?id=583700806&sig=e568889650c8bd3b94f5e993a01c2243&sitem_id=393131858&token=1784922060_e7121c65f268f9426aa8a0a84e90c30834b4e65c"
echo "Downloading 4..."
wget -O 4.zip "https://p4.bcbits.com/download/album/157705dafcda2b9a13e6636e4608e090b/wav/660679158?id=660679158&sig=529543ef768a6b9c7b2dc394b6193082&sitem_id=393131860&token=1784922052_eef302cac30c4fa6868a3c1e453d8d443649fb0d"
echo "Downloading 5..."
wget -O 5.zip "https://p4.bcbits.com/download/album/14ddf80cdc6ccbec30ebadfa13185a76a/wav/263900215?id=263900215&sig=888955bbbab49cbf4e3d9f94691ea4e6&sitem_id=393131840&token=1784922052_38de4cc0ca133ec618663b47dc6055b1fba0cc15"

echo "Extracting..."
unzip -o -d temp_extract 1.zip
unzip -o -d temp_extract 2.zip
unzip -o -d temp_extract 3.zip
unzip -o -d temp_extract 4.zip
unzip -o -d temp_extract 5.zip

echo "Copying to public/samples..."
find temp_extract -name "*.wav" -exec cp {} public/samples/ \;

echo "Cleanup..."
rm 1.zip 2.zip 3.zip 4.zip 5.zip
rm -rf temp_extract
echo "Done!"
