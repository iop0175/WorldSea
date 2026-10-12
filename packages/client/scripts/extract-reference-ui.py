from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[4]
out = Path(__file__).resolve().parents[1] / 'src/assets/reference'
source = Image.open(root / 'images/e325f3a9-4696-470b-bb50-65705db4a73b.png')
for name, bounds in {'premium':(327,28,365,69),'gold':(489,28,531,69),'stamina':(665,26,698,69),'ticket':(805,26,836,70),'menu':(887,30,923,66),'lock':(556,1380,605,1434)}.items():
    source.crop(bounds).save(out / (name + '.png'))
sheet = Image.open(root / 'images/ui/픽셀 아쿠아리움 원정 UI 모음.png')
for name, bounds in {'region-coral':(474,263,789,355),'region-deep':(551,433,620,491),'region-ancient':(638,433,703,491),'region-forest':(723,433,790,491),'hunter-kai':(471,612,529,671),'hunter-luna':(553,612,610,671),'hunter-rex':(636,612,693,671),'expedition-banner':(621,132,799,193)}.items():
    sheet.crop(bounds).save(out / (name + '.png'))
