.. _compilation:

Build from source
*****************

Cloning Wis3D
================

.. code-block:: bash

    git clone https://github.com/zju3dv/Wis3D.git


Install dependencies
=======================

* Install `Node.js <https://nodejs.org/en/download/>`_

* Install python dependencies, run

.. code-block:: bash

    pip install -r requirements.txt

Build web pages
==================

.. code-block:: bash

    cd wis3d/app
    npm install
    npx next build
    npx next export

Install wis3d package
========================

.. code-block:: bash

    cd ../..
    python setup.py develop
