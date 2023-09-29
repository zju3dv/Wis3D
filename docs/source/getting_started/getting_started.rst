.. _getting_started:

Getting started
***************

.. _install_wis3d:

Installing from wheel file
==========================

Run the following command to install Wis3D.

.. code-block:: bash

    pip install https://ootts.github.io/wis3d-2.0.0-py3-none-any.whl

.. _install_from_source:

Installing from source
======================

Please refer to https://github.com/ootts/Wis3D2/tree/main



Verify installation
======================


.. code-block:: bash

    python -c "from wis3d import Wis3D"

If there is no error, Wis3D has been successfully installed.

.. _important note:

Important note
=================
When using Wis3D, please always keep the browser inspector window open and make sure the ``Disable cache`` option in ``Network`` tab is checked. Otherwise, the browser may not update the visualization correctly.

.. _running_examples:

Running examples
=================


Wis3D provides a complete set of testing data and a simple tutorial. See https://github.com/ootts/Wis3D2/blob/main/example/test.py for the example code.

Run python example

.. code-block:: bash

    python example/test.py

Start the web service to get the visualization.

.. code-block:: bash

    wis3d --vis_dir example/visual --host 0.0.0.0 --port 19090

Open your browser, and enter http://localhost:19090 to see the results.

For more information about how to use Wis3D, please refer to :doc:`../tutorials/wis3d`.

