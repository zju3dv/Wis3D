# coding=utf-8
from argparse import ArgumentParser
from wis3d.wis3d import Wis3D
from wis3d.server import run_server
from wis3d.version import __version__

# from setuptools.config import read_configuration

# conf_dict = read_configuration(os.path.join(
#     os.path.dirname(__file__), '..', 'setup.cfg'))


def main():
    parser = ArgumentParser()
    parser.add_argument(
        "-v",
        "--version",
        action="version",
        version="{prog}s {version}".format(prog="%(prog)", version=__version__),
    )
    parser.add_argument(
        "--vis_dir", type=str, help="the dir that holds the export to visualize"
    )
    parser.add_argument(
        "--host", type=str, help="the hostname to run the service", default="0.0.0.0"
    )
    parser.add_argument(
        "--port", type=int, help="the port to run the service", default=None
    )
    parser.add_argument(
        "--verbose", default=False, action="store_true", help="log detailed info"
    )
    args = parser.parse_args()

    run_server(args.vis_dir, args.host, args.port, args.verbose)
