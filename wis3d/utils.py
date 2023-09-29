import torch
import numpy as np


def random_choice(x, size, dim=None, replace=True):
    if dim is None:
        assert len(x.shape) == 1
        n = x.shape[0]
        idxs = np.random.choice(n, size, replace)
        return x[idxs], idxs
    else:
        n = x.shape[dim]
        idxs = np.random.choice(n, size, replace)
        if isinstance(x, np.ndarray):
            swap_function = np.swapaxes
        elif isinstance(x, torch.Tensor):
            swap_function = torch.transpose
        else:
            raise TypeError()
        x_ = swap_function(x, 0, dim)
        x_ = x_[idxs]
        x_ = swap_function(x_, 0, dim)
        return x_, idxs
