cd wis3d/app
npm install # install dependencies
npx next build
npx next export
cd ../..
pip uninstall wis3d -y
python setup.py build develop
python setup.py bdist_wheel